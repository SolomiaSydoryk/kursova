from rest_framework import serializers
from api.models import (
    Card, Subscription, CustomUser, Reservation, SectionSchedule,
    Hall, Section, TimeSlot, Trainer, Notification, UserSubscription
)

class ReservationSerializer(serializers.ModelSerializer):
    hall_name = serializers.CharField(source='hall.name', read_only=True)
    hall_event_type = serializers.CharField(source='hall.event_type', read_only=True)
    section_name = serializers.CharField(source='section.__str__', read_only=True)
    section_sport_type = serializers.CharField(source='section.sport_type', read_only=True)
    section_preparation_level = serializers.CharField(source='section.preparation_level', read_only=True)
    section_trainer_name = serializers.SerializerMethodField()
    timeslot_display = serializers.CharField(source='timeslot.__str__', read_only=True)
    timeslot_date = serializers.DateField(source='timeslot.date', read_only=True)
    timeslot_start_time = serializers.TimeField(source='timeslot.start_time', read_only=True)
    timeslot_end_time = serializers.TimeField(source='timeslot.end_time', read_only=True)
    customer_first_name = serializers.CharField(source='customer.first_name', read_only=True)
    customer_last_name = serializers.CharField(source='customer.last_name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['customer', 'created_at']
    
    def get_section_trainer_name(self, obj):
        """Повертає ПІБ тренера для секції"""
        if obj.section and obj.section.trainer:
            trainer = obj.section.trainer
            return f"{trainer.first_name} {trainer.last_name}".strip()
        return None

    def validate(self, data):
        # Валідація виконується в BookingService.create_booking
        return data


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ['id', 'type', 'benefits', 'bonus_multiplier', 'price']

class UserLoyaltySerializer(serializers.ModelSerializer):
    card = CardSerializer(read_only=True)
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'bonus_points', 'card']


class SectionScheduleSerializer(serializers.ModelSerializer):
    timeslot_date = serializers.DateField(source='timeslot.date', read_only=True)
    timeslot_start_time = serializers.TimeField(source='timeslot.start_time', read_only=True)
    timeslot_end_time = serializers.TimeField(source='timeslot.end_time', read_only=True)
    hall_name = serializers.CharField(source='timeslot.hall.name', read_only=True)
    
    class Meta:
        model = SectionSchedule
        fields = '__all__'


class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'first_name', 'last_name', 'password']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        email = validated_data.get('email', '')
        # Використовуємо email як username, якщо username не вказано
        if 'username' not in validated_data:
            validated_data['username'] = email
        user = CustomUser.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Якщо пароль не вказано, встановлюємо невикористовуваний пароль 
            user.set_unusable_password()
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    card = CardSerializer(read_only=True)
    # photo для читання (повертає URL)
    photo = serializers.SerializerMethodField()
    # photo_upload для запису (приймає файл)
    photo_upload = serializers.ImageField(source='photo', write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'age', 'phone', 'photo', 'photo_upload', 'bonus_points', 'card', 'subscription',
                  'is_staff', 'is_superuser']
        read_only_fields = ['username', 'bonus_points', 'is_staff', 'is_superuser']
        extra_kwargs = {
            'photo': {'write_only': False}  # photo тільки для читання через SerializerMethodField
        }
    
    def update(self, instance, validated_data):
        print(f"=== SERIALIZER UPDATE CALLED ===")
        print(f"Validated data keys: {validated_data.keys()}")
        print(f"Photo in validated_data: {'photo' in validated_data}")
        if 'photo' in validated_data:
            print(f"Photo value: {validated_data['photo']}")
            print(f"Photo type: {type(validated_data['photo'])}")
        
        # Якщо завантажується нове фото (через photo_upload, яке мапить на photo через source='photo')
        # photo_upload автоматично мапиться на photo через source='photo', тому перевіряємо photo
        photo_file = validated_data.pop('photo', None)
        
        if photo_file:
            # Зберігаємо посилання на старе фото перед збереженням нового
            old_photo = instance.photo
            old_photo_name = old_photo.name if old_photo else None
            print(f"=== UPDATING PHOTO ===")
            print(f"Old photo name: {old_photo_name}")
            print(f"New file type: {type(photo_file)}")
            print(f"New file name: {getattr(photo_file, 'name', 'N/A')}")
            
            # Видаляємо старе фото з об'єкта ПЕРЕД збереженням нового
            if old_photo:
                print(f"Removing old photo from instance")
                # Зберігаємо шлях до старого файлу для видалення пізніше
                old_photo_path = old_photo.path if hasattr(old_photo, 'path') else None
                # Видаляємо старе фото з об'єкта
                instance.photo.delete(save=False)  # Видаляємо файл
                instance.photo = None  # Очищаємо поле
                instance.save(update_fields=['photo'])  # Зберігаємо тільки поле photo
            
            # Тепер зберігаємо нове фото (це створить новий файл з унікальною назвою через user_photo_upload_path)
            print(f"Setting new photo on instance")
            # ВАЖЛИВО: Передаємо файл напряму в поле photo
            instance.photo = photo_file
            instance.save()  # Зберігаємо, щоб викликати upload_to функцію
            print(f"Photo saved, calling super().update() for other fields")
            # Тепер викликаємо super().update() для оновлення інших полів
            instance = super().update(instance, validated_data)
            
            # Зберігаємо об'єкт, щоб файл точно зберігся
            print(f"Saving instance after update")
            instance.save()
            
            # Перезавантажуємо для отримання оновленого шляху
            instance.refresh_from_db()
            new_photo_name = instance.photo.name if instance.photo else None
            print(f"New photo name after save: {new_photo_name}")
            print(f"New photo URL: {instance.photo.url if instance.photo else 'None'}")
            
            # Перевіряємо, чи фото дійсно змінилося
            if old_photo_name == new_photo_name:
                print(f"ERROR: Photo name did not change! Still: {old_photo_name}")
                print(f"This means user_photo_upload_path function is not working!")
            else:
                print(f"SUCCESS: Photo name changed from {old_photo_name} to {new_photo_name}")
            
            # Видаляємо старе фото після успішного збереження нового
            if old_photo_name and old_photo_name != new_photo_name:
                try:
                    # Видаляємо файл з файлової системи
                    import os
                    from django.conf import settings
                    old_photo_path = os.path.join(settings.MEDIA_ROOT, old_photo_name)
                    if os.path.exists(old_photo_path):
                        os.remove(old_photo_path)
                        print(f"Deleted old photo file: {old_photo_path}")
                    else:
                        print(f"Old photo file not found: {old_photo_path}")
                except Exception as e:
                    print(f"Помилка видалення старого фото: {e}")
            print(f"=== PHOTO UPDATE COMPLETE ===")
            return instance
        return super().update(instance, validated_data)
    
    def get_photo(self, obj):
        """Повертає повний URL фото, якщо воно є"""
        if obj.photo:
            request = self.context.get('request')
            if request:
                # Отримуємо URL фото
                photo_url = request.build_absolute_uri(obj.photo.url)
                # Додаємо timestamp для оновлення кешу браузера
                import time
                timestamp = int(time.time() * 1000)
                # Завжди додаємо новий timestamp для оновлення кешу
                if '?' in photo_url:
                    photo_url = photo_url.split('?')[0]
                photo_url = f"{photo_url}?t={timestamp}"
                return photo_url
            return obj.photo.url
        return None


class TrainerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trainer
        fields = '__all__'


class HallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hall
        fields = '__all__'


class SectionSerializer(serializers.ModelSerializer):
    hall_name = serializers.CharField(source='hall.name', read_only=True)
    hall_room_number = serializers.CharField(source='hall.room_number', read_only=True)
    trainer_name = serializers.SerializerMethodField()
    available_seats = serializers.SerializerMethodField()
    original_price = serializers.DecimalField(source='price', max_digits=10, decimal_places=2, read_only=True)
    discounted_price = serializers.SerializerMethodField()
    has_discount = serializers.SerializerMethodField()
    
    class Meta:
        model = Section
        fields = '__all__'
    
    def get_trainer_name(self, obj):
        """Повертає ПІБ тренера (first_name + last_name)"""
        if obj.trainer:
            return f"{obj.trainer.first_name} {obj.trainer.last_name}".strip()
        return None
    
    def get_available_seats(self, obj):
        """
        Розраховує кількість вільних місць з урахуванням підтверджених бронювань.
        Для конкретного timeslot потрібно передавати timeslot_id через context.
        """
        # Якщо в context є timeslot_id, розраховуємо для конкретного timeslot
        timeslot_id = self.context.get('timeslot_id')
        if timeslot_id:
            from api.models import Reservation, TimeSlot
            try:
                timeslot = TimeSlot.objects.get(id=timeslot_id)
                confirmed_reservations = Reservation.objects.filter(
                    section=obj,
                    timeslot=timeslot,
                    reservation_status=Reservation.STATUS_CONFIRMED
                ).count()
                available = obj.seats_limit - confirmed_reservations
                return max(0, available)
            except TimeSlot.DoesNotExist:
                pass
        
        # Якщо timeslot не вказано, повертаємо загальну кількість місць
        return obj.seats_limit
    
    def get_has_discount(self, obj):
        """Перевіряє, чи є знижка для поточного користувача (Premium картка + плавання)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            if user.card and user.card.type == 'premium' and obj.sport_type == 'swimming':
                return True
        return False
    
    def get_discounted_price(self, obj):
        """Повертає знижену ціну для Premium картки на плавання"""
        if self.get_has_discount(obj):
            from decimal import Decimal
            return (obj.price * Decimal('0.5')).quantize(Decimal('0.01'))
        return None


class TimeSlotSerializer(serializers.ModelSerializer):
    hall_name = serializers.CharField(source='hall.name', read_only=True)
    date_display = serializers.CharField(source='date', read_only=True)
    
    class Meta:
        model = TimeSlot
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class SubscriptionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Subscription
        fields = ['id', 'type', 'type_display', 'duration_days', 'price', 'description', 'status', 'created_at']
        read_only_fields = ['created_at']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    subscription = SubscriptionSerializer(read_only=True)
    subscription_type_display = serializers.CharField(source='subscription.get_type_display', read_only=True)
    is_valid = serializers.SerializerMethodField()
    can_be_used = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSubscription
        fields = ['id', 'user', 'subscription', 'subscription_type_display', 'purchased_at', 
                  'start_date', 'end_date', 'is_active', 'is_used', 'used_at', 'is_valid', 'can_be_used']
        read_only_fields = ['purchased_at', 'is_used', 'used_at']
    
    def get_is_valid(self, obj):
        return obj.is_valid()
    
    def get_can_be_used(self, obj):
        return obj.can_be_used()
