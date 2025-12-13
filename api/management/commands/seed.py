from django.core.management.base import BaseCommand
from api.models import Hall, Section, Trainer, CustomUser, Card, Subscription
from decimal import Decimal

class Command(BaseCommand):
    help = "Seed initial data for demo catalog (halls, sections, trainers, users, cards, subscriptions)"

    def handle(self, *args, **kwargs):
        # --- Trainers ---
        trainers = {
            "Anna White": Trainer.objects.create(first_name="Anna", last_name="White", specialization="Yoga", experience_years=5),
            "John Snow": Trainer.objects.create(first_name="John", last_name="Snow", specialization="Fitness", experience_years=4),
            "Kate Miller": Trainer.objects.create(first_name="Kate", last_name="Miller", specialization="Swimming", experience_years=7),
        }

        # --- Halls ---
        fitness_hall = Hall.objects.create(
            name="Fitness Hall", event_type="Fitness", capacity=20, price=Decimal("25.00")
        )
        aqua_center = Hall.objects.create(
            name="Aqua Center", event_type="Swimming", capacity=15, price=Decimal("30.00")
        )

        # --- Sections ---
        Section.objects.create(
            hall=fitness_hall,
            trainer=trainers["Anna White"],
            min_age=12,
            sport_type="yoga",
            preparation_level="beginner",
            seats_limit=15,
            price=Decimal("15.00")
        )

        Section.objects.create(
            hall=fitness_hall,
            trainer=trainers["John Snow"],
            min_age=18,
            sport_type="fitness",
            preparation_level="advanced",
            seats_limit=20,
            price=Decimal("20.00")
        )

        Section.objects.create(
            hall=aqua_center,
            trainer=trainers["Kate Miller"],
            min_age=6,
            sport_type="swimming",
            preparation_level="beginner",
            seats_limit=10,
            price=Decimal("12.00")
        )

        Section.objects.create(
            hall=aqua_center,
            trainer=trainers["Kate Miller"],
            min_age=12,
            sport_type="swimming",
            preparation_level="intermediate",
            seats_limit=15,
            price=Decimal("18.00")
        )

        # --- Cards ---
        standard = Card.objects.create(type="standard", benefits="Basic discounts", price=Decimal("0.00"), bonus_multiplier=0.01)
        premium = Card.objects.create(type="premium", benefits="50% discount on swimming, 1% bonus from discounted amount", price=Decimal("150.00"), bonus_multiplier=0.01)

        # --- Subscriptions ---
        monthly = Subscription.objects.create(type="monthly", duration_days=30, price=Decimal("60.00"), description="Місячний абонемент")
        single = Subscription.objects.create(type="single", duration_days=1, price=Decimal("10.00"), description="Разове відвідування")

        # --- Users ---
        user1 = CustomUser.objects.create_user(
            username="demouser1",
            email="demouser1@example.com",
            password="test1234",
            first_name="Oleh",
            last_name="Koval",
            age=20,
            card=standard,
            subscription=single,
            bonus_points=120,
        )

        user2 = CustomUser.objects.create_user(
            username="demouser2",
            email="demouser2@example.com",
            password="test1234",
            first_name="Sofia",
            last_name="Ivanova",
            age=35,
            card=premium,
            subscription=monthly,
            bonus_points=450,
        )

        self.stdout.write(self.style.SUCCESS("✅ Demo catalog and users seeded successfully!"))
