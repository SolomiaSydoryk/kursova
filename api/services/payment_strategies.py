from abc import ABC, abstractmethod
from django.db import transaction
from api.models import Reservation
from api.services.loyalty import LoyaltyService 


class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, reservation: Reservation, **kwargs):
        """Провести оплату. Має оновити статус і при потребі нарахувати бонуси."""
        pass


class CardPaymentStrategy(PaymentStrategy):
    def pay(self, reservation: Reservation, **kwargs):
        with transaction.atomic():
            reservation.payment_status = Reservation.PAYMENT_PAID
            reservation.save(update_fields=['payment_status'])

            # після успішної оплати нараховуємо бонуси
            LoyaltyService.award_points_for_reservation(reservation)

        # Створюємо нагадування тільки після успішної оплати 
        from api.services.booking import BookingService
        BookingService.create_reminder_notification(reservation)

        return f"Оплата карткою успішна. Сума: {reservation.price}"


class CashPaymentStrategy(PaymentStrategy):
    def pay(self, reservation: Reservation, **kwargs):
        """
        Оплата готівкою на місці.
        payment_status залишається UNPAID (очікує оплати), поки адміністратор не підтвердить оплату.
        Бонуси НЕ нараховуються одразу - вони будуть нараховані після підтвердження адміністратором.
        Нагадування створюється одразу для секцій (бронювання вже підтверджено).
        """
        # При оплаті на місці payment_status залишається UNPAID
        # Він буде змінено на PAID після підтвердження адміністратором в UpdateReservationStatusView
        # reservation_status для секцій вже встановлено як CONFIRMED в create_booking
        
        # Створюємо нагадування одразу для секцій (бронювання вже підтверджено)
        # Для залів нагадування не створюємо, оскільки бронювання очікує підтвердження адміністратором
        if reservation.section:
            from api.services.booking import BookingService
            BookingService.create_reminder_notification(reservation)

        return f"Оплата готівкою на місці. Статус: очікує підтвердження. Сума: {reservation.price}"


class BonusPaymentStrategy(PaymentStrategy):
    def pay(self, reservation: Reservation, points_to_use: int = 0, fallback="card", **kwargs):
        """
        Оплата бонусами:
        - points_to_use — скільки бонусів хоче використати користувач
        - fallback — спосіб оплати залишку ('card' або 'cash')
        """
        user = reservation.customer

        # списуємо бонуси через LoyaltyService
        result = LoyaltyService.redeem_points_for_reservation(user, reservation, points_to_use)
        remaining = result.get("remaining_price", reservation.price)

        # якщо після бонусів залишок = 0 → повна оплата
        if remaining <= 0:
            with transaction.atomic():
                reservation.payment_status = Reservation.PAYMENT_PAID
                reservation.save(update_fields=['payment_status'])

                LoyaltyService.award_points_for_reservation(reservation)
            
            # Створюємо нагадування тільки після успішної оплати 
            from api.services.booking import BookingService
            BookingService.create_reminder_notification(reservation)
            
            return f"Оплата повністю бонусами успішна (списано {points_to_use})."

        if fallback == "card":
            CardPaymentStrategy().pay(reservation)
            return f"Оплата частково бонусами ({points_to_use}) і решта карткою ({remaining})."
        elif fallback == "cash":
            CashPaymentStrategy().pay(reservation)
            return f"Оплата частково бонусами ({points_to_use}) і решта готівкою ({remaining})."
        else:
            return f"Оплата бонусами (списано {points_to_use}), залишилось {remaining} до сплати."
