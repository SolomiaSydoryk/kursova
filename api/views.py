from api.serializers import (
    ReservationSerializer, SectionScheduleSerializer, UserLoyaltySerializer,
    UserRegisterSerializer, UserProfileSerializer, TrainerSerializer,
    HallSerializer, SectionSerializer, TimeSlotSerializer, NotificationSerializer,
    SubscriptionSerializer, UserSubscriptionSerializer
)
from api.services.booking import BookingService
from django.core.exceptions import ValidationError
from api.models import Hall, Section, TimeSlot, Reservation, SectionSchedule, Trainer, Notification, CustomUser, Subscription
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from api.services.loyalty import LoyaltyService
from django.db.models import Q, Count
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from decimal import Decimal


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class BookingCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        customer = request.user
        hall_id = request.data.get("hall")
        section_id = request.data.get("section")
        timeslot_id = request.data.get("timeslot")
        seats = request.data.get("seats", 1)
        payment_method = request.data.get("payment_method", "card")
        use_bonus_points = request.data.get("use_bonus_points", False)
        bonus_points = request.data.get("bonus_points", 0)
        user_subscription_id = request.data.get("user_subscription_id")

        hall = Hall.objects.filter(id=hall_id).first() if hall_id else None
        section = Section.objects.filter(id=section_id).first() if section_id else None
        timeslot = TimeSlot.objects.filter(id=timeslot_id).first() if timeslot_id else None

        try:
            booking = BookingService.create_booking(customer, hall, section, timeslot, seats)
            
            # Встановлюємо ціну з урахуванням знижки для Premium картки
            if section:
                original_price = section.price
                # Якщо користувач має Premium картку і секція - плавання, застосовуємо знижку 50%
                if customer.card and customer.card.type == 'premium' and section.sport_type == 'swimming':
                    # Застосовуємо знижку і обмежуємо до 2 десяткових знаків
                    booking.price = (original_price * Decimal('0.5')).quantize(Decimal('0.01'))
                else:
                    booking.price = original_price
            elif hall:
                booking.price = hall.price
            booking.save()
            
            # Обробка оплати
            if payment_method == "subscription" and user_subscription_id:
                # Оплата через абонемент
                from api.models import UserSubscription
                from django.utils import timezone
                
                try:
                    user_subscription = UserSubscription.objects.get(
                        id=user_subscription_id,
                        user=customer,
                        is_active=True
                    )
                    
                    # Перевіряємо, чи можна використати абонемент
                    if not user_subscription.can_be_used():
                        return Response(
                            {"error": "Абонемент не може бути використаний"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Зберігаємо посилання на абонемент в бронюванні
                    booking.used_subscription = user_subscription
                    booking.payment_status = Reservation.PAYMENT_PAID
                    booking.reservation_status = Reservation.STATUS_CONFIRMED
                    booking.save()
                    
                    # Якщо це разовий абонемент - позначаємо як використаний
                    if user_subscription.subscription.type == 'single':
                        user_subscription.is_used = True
                        user_subscription.used_at = timezone.now()
                        user_subscription.is_active = False  # Деактивуємо, щоб він зник з профілю
                        user_subscription.save()
                    
                    # Створюємо нагадування після успішної оплати абонементом
                    # BookingService вже імпортований на верхньому рівні
                    BookingService.create_reminder_notification(booking)
                    
                except UserSubscription.DoesNotExist:
                    return Response(
                        {"error": "Абонемент не знайдено"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            elif payment_method in ["card", "cash"]:
                from api.services.payment_strategies import CardPaymentStrategy, CashPaymentStrategy
                try:
                    if payment_method == "card":
                        strategy = CardPaymentStrategy()
                    else:
                        strategy = CashPaymentStrategy()
                    strategy.pay(booking)
                except Exception as e:
                    # Якщо оплата не вдалася - встановлюємо статус помилки
                    booking.reservation_status = Reservation.STATUS_CANCELLED
                    booking.payment_status = Reservation.PAYMENT_ERROR
                    booking.save(update_fields=['reservation_status', 'payment_status'])
                    return Response({"error": f"Помилка при оплаті: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            elif use_bonus_points and bonus_points > 0:
                from api.services.payment_strategies import BonusPaymentStrategy
                try:
                    strategy = BonusPaymentStrategy()
                    strategy.pay(booking, points_to_use=bonus_points, fallback=payment_method)
                except Exception as e:
                    # Якщо оплата не вдалася - встановлюємо статус помилки
                    booking.reservation_status = Reservation.STATUS_CANCELLED
                    booking.payment_status = Reservation.PAYMENT_ERROR
                    booking.save(update_fields=['reservation_status', 'payment_status'])
                    return Response({"error": f"Помилка при оплаті: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                "message": "Бронювання створено та оплачено",
                "id": booking.id,
                "reservation": ReservationSerializer(booking).data
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            # Якщо валідація не пройшла - встановлюємо статус помилки
            if 'booking' in locals():
                booking.reservation_status = Reservation.STATUS_CANCELLED
                booking.payment_status = Reservation.PAYMENT_ERROR
                booking.save(update_fields=['reservation_status', 'payment_status'])
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Якщо виникла інша помилка - встановлюємо статус помилки
            if 'booking' in locals():
                booking.reservation_status = Reservation.STATUS_CANCELLED
                booking.payment_status = Reservation.PAYMENT_ERROR
                booking.save(update_fields=['reservation_status', 'payment_status'])
            return Response({"error": f"Помилка при створенні бронювання: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SectionTimeslotsView(APIView):
    """
    Повертає список доступних timeslot-ів для конкретної секції
    """
    permission_classes = [permissions.AllowAny]  

    def get(self, request, section_id):
        schedules = SectionSchedule.objects.filter(section_id=section_id).select_related('timeslot')
        result = [
            {
                "timeslot_id": s.timeslot.id,
                "start_time": s.timeslot.start_time,
                "end_time": s.timeslot.end_time,
                "date": s.timeslot.date,
            }
            for s in schedules
        ]
        return Response(result, status=status.HTTP_200_OK)


class MyLoyaltyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserLoyaltySerializer(request.user)
        return Response(serializer.data)


class RedeemPointsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        reservation_id = request.data.get('reservation')
        points = int(request.data.get('points', 0))
        try:
            reservation = Reservation.objects.get(pk=reservation_id, customer=user)
        except Reservation.DoesNotExist:
            return Response({'detail': 'Reservation not found'}, status=status.HTTP_404_NOT_FOUND)

        result = LoyaltyService.redeem_points_for_reservation(user, reservation, points)
        return Response(result, status=status.HTTP_200_OK)


class SectionScheduleViewSet(viewsets.ModelViewSet):
    queryset = SectionSchedule.objects.all()
    serializer_class = SectionScheduleSerializer
    permission_classes = [permissions.IsAdminUser]



class HallViewSet(viewsets.ReadOnlyModelViewSet):
    """Список та деталі залів (тільки читання для клієнтів)"""
    queryset = Hall.objects.filter(is_active=True)
    serializer_class = HallSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Hall.objects.filter(is_active=True)
        event_type = self.request.query_params.get('event_type', None)
        capacity = self.request.query_params.get('capacity', None)
        
        if event_type:
            queryset = queryset.filter(event_type__icontains=event_type)
        
        # Фільтрація за місткістю
        # Логіка: зал підходить, якщо його місткість >= потрібної кількості місць
        if capacity:
            try:
                required_capacity = int(capacity)
                # Шукаємо зали, місткість яких >= потрібної кількості
                queryset = queryset.filter(capacity__gte=required_capacity)
            except (ValueError, TypeError):
                # Якщо не вдалося конвертувати в число, ігноруємо фільтр
                pass
        
        return queryset


class SectionViewSet(viewsets.ReadOnlyModelViewSet):
    """Список та деталі секцій з фільтрацією"""
    queryset = Section.objects.select_related('hall', 'trainer').all()
    serializer_class = SectionSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_serializer_context(self):
        """Додаємо request до context для доступу до користувача в serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        queryset = Section.objects.select_related('hall', 'trainer').all()
        
        # Фільтри
        sport_type = self.request.query_params.get('sport_type', None)
        preparation_level = self.request.query_params.get('preparation_level', None)
        age_category = self.request.query_params.get('age_category', None)
        hall_id = self.request.query_params.get('hall', None)
        
        if sport_type:
            queryset = queryset.filter(sport_type=sport_type)
        if preparation_level:
            queryset = queryset.filter(preparation_level=preparation_level)
        if hall_id:
            queryset = queryset.filter(hall_id=hall_id)
        
        # Фільтрація за віковими категоріями
        # Логіка: перевіряємо, чи вікова категорія користувача перетинається з віковим діапазоном секції
        if age_category:
            # Визначаємо діапазон віку для категорії
            age_ranges = {
                'kids': (4, 12),
                'teens': (12, 18),
                'adults': (19, 35),
                'adults_36_50': (36, 50),
                'seniors': (50, 100),  
            }
            
            if age_category in age_ranges:
                category_min, category_max = age_ranges[age_category]
                # Секція підходить, якщо її віковий діапазон перетинається з категорією
                # Враховуємо випадки, коли min_age або max_age можуть бути None
                queryset = queryset.filter(
                    Q(min_age__isnull=True) | Q(min_age__lte=category_max),
                    Q(max_age__isnull=True) | Q(max_age__gte=category_min)
                )
            
        return queryset


class TrainerViewSet(viewsets.ReadOnlyModelViewSet):
    """Список тренерів"""
    queryset = Trainer.objects.all()
    serializer_class = TrainerSerializer
    permission_classes = [permissions.AllowAny]


class AvailableTimeslotsView(APIView):
    """Повертає доступні timeslots для залу або секції"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        hall_id = request.query_params.get('hall_id')
        section_id = request.query_params.get('section_id')
        
        if section_id:
            # Для секції - показуємо тільки timeslots з SectionSchedule
            schedules = SectionSchedule.objects.filter(
                section_id=section_id
            ).select_related('timeslot', 'section')
            
            available = []
            for schedule in schedules:
                timeslot = schedule.timeslot
                section = schedule.section
                
                # Перевірка доступності (враховуємо тільки confirmed бронювання)
                confirmed = Reservation.objects.filter(
                    section=section,
                    timeslot=timeslot,
                    reservation_status=Reservation.STATUS_CONFIRMED
                ).count()
                
                available_seats = section.seats_limit - confirmed
                
                # Показуємо всі timeslots, навіть якщо місць немає (для відображення інформації)
                available.append({
                    'id': timeslot.id,
                    'date': timeslot.date.isoformat(),
                    'start_time': timeslot.start_time.isoformat(),
                    'end_time': timeslot.end_time.isoformat(),
                    'available_seats': max(0, available_seats),  
                    'total_seats': section.seats_limit
                })
            
            return Response(available, status=status.HTTP_200_OK)
        
        elif hall_id:
            # Для залу - показуємо всі timeslots з інформацією про доступність
            hall = Hall.objects.get(id=hall_id)
            
            # Знаходимо дати (day, month, year), де є секції (заблоковані дні)
            # Отримуємо унікальні комбінації day, month, year з SectionSchedule
            blocked_dates = SectionSchedule.objects.filter(
                section__hall=hall
            ).values_list('timeslot__day', 'timeslot__month', 'timeslot__year').distinct()
            
            # Створюємо set для швидкої перевірки
            blocked_dates_set = {(day, month, year) for day, month, year in blocked_dates}
            
            # Знаходимо всі timeslots залу (не фільтруємо, щоб користувач міг вибрати дату)
            all_timeslots = TimeSlot.objects.filter(hall=hall)
            
            available = []
            for timeslot in all_timeslots:
                # Перевіряємо чи є секції на цей день
                has_sections = (timeslot.day, timeslot.month, timeslot.year) in blocked_dates_set
                
                # Перевіряємо чи є будь-яке бронювання (confirmed або pending) на цей timeslot
                has_booking = Reservation.objects.filter(
                    hall=hall,
                    timeslot=timeslot,
                    reservation_status__in=[Reservation.STATUS_CONFIRMED, Reservation.STATUS_PENDING]
                ).exists()
                
                # Зал недоступний якщо є секції або бронювання
                is_unavailable = has_sections or has_booking
                
                # Для залів показуємо всі timeslots, але з інформацією про доступність
                available.append({
                    'id': timeslot.id,
                    'date': timeslot.date.isoformat(),
                    'start_time': timeslot.start_time.isoformat(),
                    'end_time': timeslot.end_time.isoformat(),
                    'available_seats': 0 if is_unavailable else 1,  # 0 = недоступно, 1 = доступно
                    'total_seats': hall.capacity,
                    'is_booked': is_unavailable,  # Додаткова інформація про те, чи недоступно
                    'has_sections': has_sections,  # Чи є секції на цей день
                })
            
            return Response(available, status=status.HTTP_200_OK)
        
        return Response(
            {'error': 'Потрібно вказати hall_id або section_id'},
            status=status.HTTP_400_BAD_REQUEST
        )


class EmailLoginView(APIView):
    """
    Кастомний endpoint для входу через email.
    Приймає email та password, знаходить користувача за email,
    і повертає JWT токени.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'detail': 'Потрібно вказати email та password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Знаходимо користувача за email
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'Невірний email або password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except CustomUser.MultipleObjectsReturned:
            # Якщо є кілька користувачів з однаковим email
            user = CustomUser.objects.filter(email=email).first()
        
        # Перевіряємо пароль
        if not user.check_password(password):
            return Response(
                {'detail': 'Невірний email або password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Перевіряємо чи користувач активний
        if not user.is_active:
            return Response(
                {'detail': 'Обліковий запис деактивовано'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Генеруємо JWT токени
        refresh = RefreshToken.for_user(user)
        
        # Використовуємо serializer для консистентності
        from api.serializers import UserProfileSerializer
        user_serializer = UserProfileSerializer(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_serializer.data
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """Реєстрація нового користувача"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Генеруємо JWT токени для автоматичного входу
            refresh = RefreshToken.for_user(user)
            user_serializer = UserProfileSerializer(user)
            
            return Response({
                'message': 'Користувача успішно створено',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    """Отримання та оновлення профілю користувача"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        print(f"=== VIEW PUT CALLED ===")
        print(f"Request data keys: {request.data.keys()}")
        print(f"Photo in request.data: {'photo' in request.data}")
        if 'photo' in request.data:
            print(f"Photo file: {request.data['photo']}")
            print(f"Photo type: {type(request.data['photo'])}")
        
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            print(f"Serializer is valid")
            # Зберігаємо дані
            user = serializer.save()
            # Перезавантажуємо користувача з бази даних для отримання оновленого фото
            user.refresh_from_db()
            # ВАЖЛИВО: Явно перезавантажуємо поле photo
            from django.db import transaction
            with transaction.atomic():
                # Отримуємо свіжий об'єкт з БД
                user = type(user).objects.get(pk=user.pk)
            
            # Логуємо для діагностики
            print(f"=== VIEW: Photo after refresh ===")
            if user.photo:
                print(f"Photo name: {user.photo.name}")
                print(f"Photo URL: {user.photo.url}")
            else:
                print("Photo is None after refresh!")
            
            # Повертаємо оновлені дані з новим serializer
            updated_serializer = UserProfileSerializer(user, context={'request': request})
            response_data = updated_serializer.data
            print(f"=== VIEW: Response data ===")
            if response_data.get('photo'):
                print(f"Photo URL in response: {response_data['photo']}")
            else:
                print("Photo URL is None in response!")
            return Response(response_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyReservationsView(APIView):
    """Список бронювань поточного користувача"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        reservations = Reservation.objects.filter(
            customer=request.user
        ).select_related('hall', 'section', 'timeslot').order_by('-created_at')
        
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data)


class NotificationsView(APIView):
    """Список сповіщень користувача"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        notifications = Notification.objects.filter(
            customer=request.user
        ).order_by('-date_time')
        
        unread_count = notifications.filter(is_read=False).count()
        serializer = NotificationSerializer(notifications, many=True)
        
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count
        })


class NotificationReadView(APIView):
    """Позначити сповіщення як прочитане"""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                customer=request.user
            )
            notification.is_read = True
            notification.save()
            return Response({'message': 'Сповіщення позначено як прочитане'})
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Сповіщення не знайдено'},
                status=status.HTTP_404_NOT_FOUND
            )


class MarkAllNotificationsReadView(APIView):
    """Позначити всі сповіщення як прочитані"""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request):
        Notification.objects.filter(
            customer=request.user,
            is_read=False
        ).update(is_read=True)
        
        return Response({'message': 'Всі сповіщення позначено як прочитані'})


class SubscriptionsListView(APIView):
    """Список активних абонементів для покупки"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        subscriptions = Subscription.objects.filter(status='active')
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)


class SubscriptionPurchaseView(APIView):
    """Покупка абонемента користувачем"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, subscription_id):
        try:
            subscription = Subscription.objects.get(id=subscription_id, status='active')
        except Subscription.DoesNotExist:
            return Response({'error': 'Абонемент не знайдено або неактивний'}, status=status.HTTP_404_NOT_FOUND)
        
        # Створюємо UserSubscription
        from datetime import date, timedelta
        from api.models import UserSubscription
        
        start_date = date.today()
        end_date = start_date + timedelta(days=subscription.duration_days)
        
        user_subscription = UserSubscription.objects.create(
            user=request.user,
            subscription=subscription,
            start_date=start_date,
            end_date=end_date,
            is_active=True,
            is_used=False
        )
        
        serializer = UserSubscriptionSerializer(user_subscription)
        return Response({
            'message': f'Абонемент {subscription.get_type_display()} успішно придбано',
            'user_subscription': serializer.data
        }, status=status.HTTP_201_CREATED)


class MySubscriptionsView(APIView):
    """Список активних абонементів поточного користувача"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from api.models import UserSubscription, Subscription
        from django.utils import timezone
        
        user_subscriptions = UserSubscription.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('-purchased_at')
        
        # Фільтруємо тільки дійсні абонементи
        today = timezone.now().date()
        valid_subscriptions = []
        for us in user_subscriptions:
            if us.subscription.type == Subscription.TYPE_SINGLE:
                # Для разового - показуємо якщо не використаний
                if not us.is_used:
                    valid_subscriptions.append(us)
            else:
                # Для місячного - показуємо якщо не минув термін
                if today <= us.end_date:
                    valid_subscriptions.append(us)
        
        serializer = UserSubscriptionSerializer(valid_subscriptions, many=True)
        return Response(serializer.data)
