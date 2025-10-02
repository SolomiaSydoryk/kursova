from decimal import Decimal
from datetime import time
from django.core.management.base import BaseCommand
from api.models import Card, Subscription, Trainer, Hall, Section, TimeSlot, CustomUser, Reservation

class Command(BaseCommand):
    help = "Seed DB with initial test data (idempotent). Run: python manage.py seed"

    def handle(self, *args, **options):
        # --- Cards ---
        cards = [
            ('standard', 'Standard access', Decimal('0.00'), 1.0),
            ('premium', 'Free pool access', Decimal('50.00'), 1.5),
            ('corporate', 'Corporate discounts', Decimal('100.00'), 2.0),
        ]
        for ctype, benefits, price, mult in cards:
            Card.objects.update_or_create(
                type=ctype,
                defaults={'benefits': benefits, 'price': price, 'bonus_multiplier': mult}
            )

        # --- Subscriptions ---
        subs = [
            ('single', 1, Decimal('10.00'), 'one-time entry'),
            ('monthly', 30, Decimal('100.00'), 'monthly pass'),
            ('corporate', 30, Decimal('500.00'), 'corporate package'),
        ]
        for stype, duration, price, desc in subs:
            Subscription.objects.update_or_create(
                type=stype,
                defaults={'duration_days': duration, 'price': price, 'description': desc, 'status': 'active'}
            )

        # --- Trainer ---
        trainer, _ = Trainer.objects.get_or_create(
            first_name='Ivan', last_name='Ivanov',
            defaults={'specialization': 'Fitness', 'experience_years': 5}
        )

        # --- Hall ---
        hall, _ = Hall.objects.get_or_create(
            name='Main Hall', room_number='A1',
            defaults={'event_type': 'Fitness', 'capacity': 30, 'price': Decimal('100.00'), 'is_active': True}
        )

        # --- Section ---
        section, _ = Section.objects.get_or_create(
            hall=hall, sport_type='yoga', preparation_level='beginner',
            defaults={'name': 'Yoga Group', 'min_age': 16, 'max_age': 60, 'price': Decimal('20.00'), 'free_seats': 15, 'trainer': trainer}
        )

        # --- TimeSlot ---
        timeslot, _ = TimeSlot.objects.get_or_create(
            day=2, month=10, month_name='October', year=2025,
            start_time=time(18, 0), end_time=time(19, 0)
        )

        # --- User (safely create or get) ---
        user, created = CustomUser.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com', 'age': 25}
        )
        if created:
            user.set_password('pass1234')
            user.save()

        # --- Reservation (idempotent: one reservation per user/hall/section/timeslot) ---
        res, created = Reservation.objects.get_or_create(
            customer=user, hall=hall, section=section, timeslot=timeslot,
            defaults={
                'reservation_status': Reservation.STATUS_CONFIRMED,
                'payment_status': Reservation.PAYMENT_PAID,
                'price': section.price,
                'seats': 1
            }
        )

        self.stdout.write(self.style.SUCCESS('Seed finished.'))
        self.stdout.write(f'User: {user.username} (created={created})')
        self.stdout.write(f'Reservation id: {res.id} (created={created})')
