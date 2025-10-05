from api.models import Reservation, Section, Hall, Notification
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta
from api.services.notification import create_and_notify


class BookingService:
    @staticmethod
    def create_booking(customer, hall=None, section=None, timeslot=None, seats=1):
        """
        Створює бронювання для користувача.
        """

        if not hall and not section:
            raise ValidationError("Потрібно вказати або зал, або секцію.")

        if section:
            if section.min_age and customer.age < section.min_age:
                raise ValidationError("Користувач занадто молодий для цієї секції.")
            if section.max_age and customer.age > section.max_age:
                raise ValidationError("Користувач занадто дорослий для цієї секції.")

        if section:
            confirmed = Reservation.objects.filter(
                section=section, timeslot=timeslot,
                reservation_status=Reservation.STATUS_CONFIRMED
            ).count()
            if confirmed + seats > section.free_seats:
                raise ValidationError("Немає достатньо місць у секції.")
        else:
            confirmed = Reservation.objects.filter(
                hall=hall, timeslot=timeslot,
                reservation_status=Reservation.STATUS_CONFIRMED
            ).count()
            if confirmed + seats > hall.capacity:
                raise ValidationError("Немає достатньо місць у залі.")

        exists = Reservation.objects.filter(
            customer=customer, timeslot=timeslot, hall=hall, section=section
        ).exists()
        if exists:
            raise ValidationError("У вас вже є бронювання на цей час.")

        booking = Reservation.objects.create(
            customer=customer,
            hall=hall,
            section=section,
            timeslot=timeslot,
            seats=seats,
            reservation_status=Reservation.STATUS_CONFIRMED
        )

        event_dt = datetime.combine(timeslot.date, timeslot.start_time)
        event_dt = timezone.make_aware(event_dt, timezone.get_current_timezone())
        send_at = event_dt - timedelta(days=1)

        msg = f"Нагадування: у вас бронювання #{booking.id} у залі {booking.hall or booking.section} {event_dt.strftime('%Y-%m-%d %H:%M')}."
        create_and_notify(
            booking.customer,
            Notification.TYPE_REMINDER,
            msg,
            send_at=send_at
        )

        return booking
