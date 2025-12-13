from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from api.models import Reservation, CustomUser, Notification
from api.services.notification import create_and_notify

POINT_VALUE = Decimal(str(getattr(settings, 'LOYALTY_POINT_VALUE', 0.01)))
PREMIUM_THRESHOLD = int(getattr(settings, 'LOYALTY_PREMIUM_THRESHOLD', 1000))


class LoyaltyService:
    @staticmethod
    def calculate_points(amount: Decimal, multiplier: float = 1.0) -> Decimal:
        """
        Обчислити бонусні бали з суми і множника.
        Множник має бути 0.01 для 1% (наприклад, 9 грн * 0.01 = 0.09 балів).
        Повертає Decimal без округлення до цілого (0.09 залишається 0.09).
        """
        if amount is None:
            return Decimal('0.00')
        # Конвертуємо multiplier в Decimal, обережно з форматом
        multiplier_decimal = Decimal(str(multiplier))
        # Обчислюємо бонуси: amount * multiplier
        pts = amount * multiplier_decimal
        # Округлюємо до 2 десяткових знаків (для збереження точності)
        pts_rounded = pts.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return max(Decimal('0.00'), pts_rounded)

    @staticmethod
    def award_points_for_reservation(reservation: Reservation) -> Decimal:
        """
        Нарахувати бали за бронювання.
        Викликаємо після підтвердженої оплати (payment_status == PAID).
        Повертає кількість нарахованих балів (Decimal).
        Для Premium картки: нараховуємо 1% від зниженої суми (якщо була знижка).
        Множник bonus_multiplier вже містить правильне значення (0.01 для 1%).
        """
        if reservation is None or reservation.payment_status != Reservation.PAYMENT_PAID:
            return Decimal('0.00')

        user = reservation.customer
        card = user.card
        # Множник для нарахування бонусів (0.01 = 1% для Standard, 0.01 = 1% для Premium)
        # bonus_multiplier має бути 0.01 для обох карток
        if card:
            # Отримуємо множник з картки, переконуємося що це Decimal
            card_multiplier = card.bonus_multiplier
            # Якщо bonus_multiplier >= 1.0, це помилка - використовуємо 0.01
            if card_multiplier >= 1.0:
                multiplier = Decimal('0.01')
            else:
                multiplier = Decimal(str(card_multiplier))
        else:
            multiplier = Decimal('0.01')
        
        # Для Premium нараховуємо від зниженої суми (яка вже застосована в reservation.price)
        amount = reservation.price or Decimal('0.00')
        
        # Додаємо логування для діагностики
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Calculating points: amount={amount}, multiplier={multiplier}, card_type={card.type if card else 'None'}, card_bonus_multiplier={card.bonus_multiplier if card else 'None'}")
        
        pts = LoyaltyService.calculate_points(amount, multiplier)
        
        logger.info(f"Calculated points: {pts} (type: {type(pts)})")

        # Перевіряємо, чи є бонуси для нарахування (навіть якщо це 0.09)
        if pts > Decimal('0.00'):
            with transaction.atomic():
                u = CustomUser.objects.select_for_update().get(pk=user.pk)
                current_points = u.bonus_points or Decimal('0.00')
                # Переконуємося що current_points це Decimal
                if isinstance(current_points, (int, float)):
                    current_points = Decimal(str(current_points))
                elif not isinstance(current_points, Decimal):
                    current_points = Decimal(str(current_points))
                
                logger.info(f"Before: current_points={current_points} (type: {type(current_points)}), pts={pts}")
                new_points = current_points + pts
                logger.info(f"After: new_points={new_points}")
                
                u.bonus_points = new_points
                u.save(update_fields=['bonus_points'])
                
                # Перевіряємо, чи збереглося
                u.refresh_from_db()
                logger.info(f"Saved: bonus_points={u.bonus_points} (type: {type(u.bonus_points)})")
                
                # Оновлюємо points_awarded для reservation
                # Reservation вже імпортований на верхньому рівні
                Reservation.objects.filter(pk=reservation.pk).update(points_awarded=True)
                
                # Створюємо сповіщення про нарахування бонусів
                # Форматуємо кількість бонусів (прибираємо зайві нулі, наприклад 0.09 замість 0.09)
                pts_formatted = f"{pts:.2f}".rstrip('0').rstrip('.')
                bonus_message = f"Вам нараховано {pts_formatted} бонусів!"
                create_and_notify(
                    user,
                    Notification.TYPE_BONUS,
                    bonus_message
                )
        else:
            logger.warning(f"Points not awarded: pts={pts} is not greater than 0.00")
        return pts

    @staticmethod
    def points_to_currency(points) -> Decimal:
        """Перетворити бали у суму валюти."""
        # points може бути int або Decimal
        points_decimal = Decimal(str(points)) if not isinstance(points, Decimal) else points
        return (points_decimal * POINT_VALUE).quantize(Decimal('0.01'))

    @staticmethod
    def redeem_points_for_reservation(user: CustomUser, reservation: Reservation, points_to_redeem) -> dict:
        """
        Списати бали для часткової/повної оплати reservation.price.
        Повертає dict: {'used_points': Decimal, 'discount': Decimal, 'remaining_price': Decimal}
        Виконуємо у транзакції.
        """
        # Конвертуємо points_to_redeem в Decimal якщо потрібно
        points_to_redeem_decimal = Decimal(str(points_to_redeem)) if not isinstance(points_to_redeem, Decimal) else points_to_redeem
        if points_to_redeem_decimal <= Decimal('0.00'):
            return {'used_points': Decimal('0.00'), 'discount': Decimal('0.00'), 'remaining_price': reservation.price}

        with transaction.atomic():
            u = CustomUser.objects.select_for_update().get(pk=user.pk)
            available = u.bonus_points or Decimal('0.00')
            # Переконуємося що available це Decimal
            if isinstance(available, (int, float)):
                available = Decimal(str(available))
            use = min(available, points_to_redeem_decimal)
            discount = LoyaltyService.points_to_currency(use)
            remaining = reservation.price - discount
            if remaining < Decimal('0.00'):
                # залишимо невикористані бали і перевіримо потрібну кількість балів для повного покриття
                needed_for_full = (reservation.price / POINT_VALUE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
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

        if u.bonus_points >= PREMIUM_THRESHOLD:
            # Використовуємо Factory Method для створення картки
            from api.models import Card
            from api.services.card_factory import CardFactoryMethod
            card = CardFactoryMethod.create_card_by_type(Card.TYPE_PREMIUM)
            u.card = card
            u.save(update_fields=['card'])
            return card
        return None
