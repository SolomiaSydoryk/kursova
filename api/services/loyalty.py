from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from api.models import Reservation, CustomUser

POINT_VALUE = Decimal(str(getattr(settings, 'LOYALTY_POINT_VALUE', 0.01)))
PREMIUM_THRESHOLD = int(getattr(settings, 'LOYALTY_PREMIUM_THRESHOLD', 1000))
CORPORATE_THRESHOLD = int(getattr(settings, 'LOYALTY_CORPORATE_THRESHOLD', 5000))


class LoyaltyService:
    @staticmethod
    def calculate_points(amount: Decimal, multiplier: float = 1.0) -> int:
        """Обчислити цілі бонусні бали з суми і множника."""
        if amount is None:
            return 0
        pts = (amount * Decimal(str(multiplier))).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
        return max(0, int(pts))

    @staticmethod
    def award_points_for_reservation(reservation: Reservation) -> int:
        """
        Нарахувати бали за бронювання.
        Викликаємо після підтвердженої оплати (payment_status == PAID).
        Повертає кількість нарахованих балів.
        """
        if reservation is None or reservation.payment_status != Reservation.PAYMENT_PAID:
            return 0

        user = reservation.customer
        card = user.card
        multiplier = card.bonus_multiplier if card else 1.0
        amount = reservation.price or Decimal('0.00')
        pts = LoyaltyService.calculate_points(amount, multiplier)

        if pts > 0:
            with transaction.atomic():
                u = CustomUser.objects.select_for_update().get(pk=user.pk)
                u.bonus_points = (u.bonus_points or 0) + pts
                u.save(update_fields=['bonus_points'])
        return pts

    @staticmethod
    def points_to_currency(points: int) -> Decimal:
        """Перетворити бали у суму валюти."""
        return (Decimal(points) * POINT_VALUE).quantize(Decimal('0.01'))

    @staticmethod
    def redeem_points_for_reservation(user: CustomUser, reservation: Reservation, points_to_redeem: int) -> dict:
        """
        Списати бали для часткової/повної оплати reservation.price.
        Повертає dict: {'used_points': int, 'discount': Decimal, 'remaining_price': Decimal}
        Виконуємо у транзакції.
        """
        if points_to_redeem <= 0:
            return {'used_points': 0, 'discount': Decimal('0.00'), 'remaining_price': reservation.price}

        with transaction.atomic():
            u = CustomUser.objects.select_for_update().get(pk=user.pk)
            available = u.bonus_points or 0
            use = min(available, points_to_redeem)
            discount = LoyaltyService.points_to_currency(use)
            remaining = reservation.price - discount
            if remaining < Decimal('0.00'):
                # залишимо невикористані бали і перевіримо потрібну кількість балів для повного покриття
                needed_for_full = int((reservation.price / POINT_VALUE).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
                use = min(available, needed_for_full)
                discount = LoyaltyService.points_to_currency(use)
                remaining = reservation.price - discount
            u.bonus_points = available - use
            u.save(update_fields=['bonus_points'])

            reservation.price = remaining.quantize(Decimal('0.01'))
            reservation.save(update_fields=['price'])
            return {'used_points': use, 'discount': discount, 'remaining_price': reservation.price}

    @staticmethod
    def maybe_upgrade_card(user: CustomUser):
        """При накопиченні певних сум/балів — оновити type картки."""
        try:
            u = CustomUser.objects.select_for_update().get(pk=user.pk)
        except CustomUser.DoesNotExist:
            return None

        if u.bonus_points >= CORPORATE_THRESHOLD:
            from api.models import Card
            card = Card.objects.filter(type=Card.TYPE_CORPORATE).first()
            if card:
                u.card = card
                u.save(update_fields=['card'])
                return card
        if u.bonus_points >= PREMIUM_THRESHOLD:
            from api.models import Card
            card = Card.objects.filter(type=Card.TYPE_PREMIUM).first()
            if card:
                u.card = card
                u.save(update_fields=['card'])
                return card
        return None
