from api.models import Reservation, Section, Hall, Notification, SectionSchedule
from django.core.exceptions import ValidationError
from api.services.notification import create_and_notify


class BookingService:
    @staticmethod
    def create_booking(customer, hall=None, section=None, timeslot=None, seats=1):
        """
        Створює бронювання для користувача з урахуванням розкладу секцій.
        """

        if not timeslot:
            raise ValidationError("Необхідно вибрати часовий слот.")

        if not hall and not section:
            raise ValidationError("Потрібно вказати або зал, або секцію.")

        # Якщо бронювання секції — валідації
        if section:
            # Секцію можна бронювати тільки якщо вона доступна в цей час
            if not SectionSchedule.objects.filter(section=section, timeslot=timeslot).exists():
                raise ValidationError("Секція не доступна на цей час.")

            # Забираємо зал з секції (для блокування)
            hall = section.hall

            # Перевірка ліміту секції
            confirmed = Reservation.objects.filter(
                section=section,
                timeslot=timeslot,
                reservation_status=Reservation.STATUS_CONFIRMED
            ).count()

            if confirmed + seats > section.seats_limit:
                raise ValidationError("Немає достатньо місць у секції.")

        # Якщо бронювання залу — враховуємо секційні розклади
        if hall and not section:
            # Якщо є секція на цей день (незалежно від часу) — не можна бронювати зал
            # Перевіряємо чи є будь-які секції на цей день (day, month, year)
            if SectionSchedule.objects.filter(
                section__hall=hall,
                timeslot__day=timeslot.day,
                timeslot__month=timeslot.month,
                timeslot__year=timeslot.year
            ).exists():
                raise ValidationError("У цей день у залі є секції — зал недоступний.")

            # Перевірка чи зал вже заброньований на цей день (бронюємо весь зал на весь день)
            # Перевіряємо чи є будь-яке бронювання (confirmed або pending) на цей timeslot
            existing_booking = Reservation.objects.filter(
                hall=hall,
                timeslot=timeslot
            ).exclude(reservation_status=Reservation.STATUS_CANCELLED).first()

            if existing_booking:
                raise ValidationError("Зал вже заброньований на цей день.")

        # Перевірка чи користувач вже має бронювання на цей час
        # Один запис на конкретний час для користувача
        exists = Reservation.objects.filter(
            customer=customer,
            timeslot=timeslot
        ).exists()

        if exists:
            raise ValidationError("У вас вже є бронювання на цей час.")

        # Створення бронювання
        # Для залів - статус PENDING (потребує підтвердження адміністратора)
        # Для секцій - статус CONFIRMED (автоматичне підтвердження)
        initial_status = Reservation.STATUS_PENDING if (hall and not section) else Reservation.STATUS_CONFIRMED
        
        booking = Reservation.objects.create(
            customer=customer,
            hall=hall,
            section=section,
            timeslot=timeslot,
            seats=seats,
            reservation_status=initial_status
        )


        return booking

    @staticmethod
    def create_reminder_notification(reservation: Reservation):
        """
        Створює нагадування для бронювання після успішної оплати.
        Викликається тільки після підтвердження оплати.
        """
        if not reservation:
            return None

        timeslot = reservation.timeslot
        section = reservation.section
        hall = reservation.hall

        # Нагадування - відображається в UI одразу після створення

        if section:
            sport_type_map = {
                'fitness': 'Фітнес',
                'swimming': 'Плавання',
                'pilates': 'Пілатес',
                'volleyball': 'Волейбол',
                'tennis': 'Теніс',
                'yoga': 'Йога',
            }
            level_map = {
                'beginner': 'Початковий рівень',
                'intermediate': 'Середній рівень',
                'advanced': 'Просунутий рівень',
            }
            sport_type = sport_type_map.get(section.sport_type, section.sport_type.capitalize() if section.sport_type else "")
            preparation_level = level_map.get(section.preparation_level, section.preparation_level.capitalize() if section.preparation_level else "")
            section_name = f"{sport_type} ({preparation_level})"
            hall_name = hall.name if hall else "невідомий зал"
            time_str = timeslot.start_time.strftime('%H:%M')
            date_str = timeslot.date.strftime('%d.%m.%Y')
            msg = (
                f"Нагадування: У вас є бронювання секції {section_name} о {time_str} {date_str} у залі {hall_name}."
            )
        else:
            hall_name = hall.name if hall else "невідомий зал"
            date_str = timeslot.date.strftime('%d.%m.%Y')
            msg = (
                f"Нагадування: У вас є бронювання залу {hall_name} на {date_str}."
            )

        create_and_notify(
            reservation.customer,
            Notification.TYPE_REMINDER,
            msg
        )
