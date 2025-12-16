from django.core.management.base import BaseCommand
from api.models import (
    Hall, Section, Trainer, CustomUser, Card, Subscription,
    TimeSlot, SectionSchedule, Reservation
)
from decimal import Decimal
from datetime import date, time, timedelta


class Command(BaseCommand):
    help = "Seed final data: admin, trainers, halls, sections, schedules, user"

    def handle(self, *args, **kwargs):
        # Видаляємо старі дані
        self.stdout.write("Видалення старих даних...")
        Reservation.objects.all().delete()
        SectionSchedule.objects.all().delete()
        TimeSlot.objects.all().delete()
        Section.objects.all().delete()
        Hall.objects.all().delete()
        Trainer.objects.all().delete()
        CustomUser.objects.filter(is_staff=False).delete()
        
        # --- Адміністратор ---
        self.stdout.write("Створення адміністратора...")
        admin, created = CustomUser.objects.get_or_create(
            username="admin",
            defaults={
                'email': 'admin@sport.com',
                'first_name': 'Соломія',
                'last_name': 'Сидорик',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"Адмін створено: {admin.get_full_name()}"))
        else:
            admin.first_name = 'Соломія'
            admin.last_name = 'Сидорик'
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"Адмін оновлено: {admin.get_full_name()}"))

        # --- Тренери ---
        self.stdout.write("🏋️  Створення тренерів...")
        trainers = {
            "Марія Волянська": Trainer.objects.create(
                first_name="Марія",
                last_name="Волянська",
                specialization="Фітнес",
                experience_years=6
            ),
            "Олег Дудар": Trainer.objects.create(
                first_name="Олег",
                last_name="Дудар",
                specialization="Плавання",
                experience_years=8
            ),
            "Оксана Загородня": Trainer.objects.create(
                first_name="Оксана",
                last_name="Загородня",
                specialization="Плавання",
                experience_years=5
            ),
            "Лілія Матвійчук": Trainer.objects.create(
                first_name="Лілія",
                last_name="Матвійчук",
                specialization="Пілатес",
                experience_years=7
            ),
            "Дмитро Савчук": Trainer.objects.create(
                first_name="Дмитро",
                last_name="Савчук",
                specialization="Волейбол",
                experience_years=10
            ),
            "Маркіян Чорненький": Trainer.objects.create(
                first_name="Маркіян",
                last_name="Чорненький",
                specialization="Теніс",
                experience_years=9
            ),
            "Наталя Вишнянська": Trainer.objects.create(
                first_name="Наталя",
                last_name="Вишнянська",
                specialization="Фітнес",
                experience_years=4
            ),
        }
        self.stdout.write(self.style.SUCCESS(f"Створено {len(trainers)} тренерів"))

        # --- Зали ---
        self.stdout.write("Створення залів...")
        halls = {
            "pilates_vibe": Hall.objects.create(
                name="Pilates Vibe",
                room_number="2",
                event_type="pilates",
                capacity=20,
                price=Decimal("3000.00")
            ),
            "fitness_hall": Hall.objects.create(
                name="Fitness Hall",
                room_number="12",
                event_type="fitness",
                capacity=25,
                price=Decimal("2500.00")
            ),
            "aqua_center": Hall.objects.create(
                name="Aqua Center",
                room_number="8",
                event_type="swimming",
                capacity=150,  # Збільшено для трибун
                price=Decimal("3500.00")
            ),
            "tennis_court": Hall.objects.create(
                name="Tennis Court",
                room_number="5",
                event_type="tennis",
                capacity=50,
                price=Decimal("4000.00")
            ),
            "volleyball_arena": Hall.objects.create(
                name="Volleyball Arena",
                room_number="15",
                event_type="volleyball",
                capacity=200,  # Збільшено для трибун
                price=Decimal("2800.00")
            ),
        }
        self.stdout.write(self.style.SUCCESS(f"Створено {len(halls)} залів"))

        # --- Секції ---
        self.stdout.write("Створення секцій...")
        sections = {
            "swimming_beginner": Section.objects.create(
                hall=halls["aqua_center"],
                trainer=trainers["Олег Дудар"],
                min_age=6,
                max_age=12,
                sport_type="swimming",
                preparation_level="beginner",
                seats_limit=10,
                price=Decimal("1000.00")
            ),
            "swimming_intermediate": Section.objects.create(
                hall=halls["aqua_center"],
                trainer=trainers["Оксана Загородня"],
                min_age=12,
                max_age=18,
                sport_type="swimming",
                preparation_level="intermediate",
                seats_limit=12,
                price=Decimal("1200.00")
            ),
            "fitness_beginner": Section.objects.create(
                hall=halls["fitness_hall"],
                trainer=trainers["Марія Волянська"],
                min_age=16,
                sport_type="fitness",
                preparation_level="beginner",
                seats_limit=20,
                price=Decimal("600.00")
            ),
            "fitness_advanced": Section.objects.create(
                hall=halls["fitness_hall"],
                trainer=trainers["Наталя Вишнянська"],
                min_age=18,
                sport_type="fitness",
                preparation_level="advanced",
                seats_limit=15,
                price=Decimal("1500.00")
            ),
            "pilates": Section.objects.create(
                hall=halls["pilates_vibe"],
                trainer=trainers["Лілія Матвійчук"],
                min_age=14,
                sport_type="pilates",
                preparation_level="intermediate",
                seats_limit=18,
                price=Decimal("900.00")
            ),
            "volleyball": Section.objects.create(
                hall=halls["volleyball_arena"],
                trainer=trainers["Дмитро Савчук"],
                min_age=12,
                sport_type="volleyball",
                preparation_level="intermediate",
                seats_limit=12,
                price=Decimal("500.00")
            ),
            "tennis": Section.objects.create(
                hall=halls["tennis_court"],
                trainer=trainers["Маркіян Чорненький"],
                min_age=10,
                sport_type="tennis",
                preparation_level="beginner",
                seats_limit=4,
                price=Decimal("800.00")
            ),
        }
        self.stdout.write(self.style.SUCCESS(f"Створено {len(sections)} секцій"))

        # --- Cards та Subscriptions ---
        self.stdout.write("Створення карток та абонементів...")
        standard = Card.objects.get_or_create(
            type="standard",
            defaults={
                'benefits': 'Базові знижки',
                'price': Decimal("0.00"),
                'bonus_multiplier': 0.01
            }
        )[0]
        premium = Card.objects.get_or_create(
            type="premium",
            defaults={
                'benefits': '50% знижка на плавання, 1% бонусні бали від зниженої суми',
                'price': Decimal("2000.00"),
                'bonus_multiplier': 0.01
            }
        )[0]
        
        monthly, created_monthly = Subscription.objects.get_or_create(
            type="monthly",
            defaults={
                'duration_days': 30,
                'price': Decimal("3000.00"),
                'description': 'Місячний абонемент'
            }
        )
        if not created_monthly:
            # Оновлюємо існуючий абонемент
            monthly.price = Decimal("3000.00")
            monthly.duration_days = 30
            monthly.description = 'Місячний абонемент'
            monthly.save()
        
        single, created_single = Subscription.objects.get_or_create(
            type="single",
            defaults={
                'duration_days': 1,
                'price': Decimal("700.00"),
                'description': 'Разове відвідування'
            }
        )
        if not created_single:
            # Оновлюємо існуючий абонемент
            single.price = Decimal("700.00")
            single.duration_days = 1
            single.description = 'Разове відвідування'
            single.save()

        # --- Користувач ---
        self.stdout.write("Створення користувача...")
        user = CustomUser.objects.create_user(
            username="diana_buvaylo",
            email="diana.buvaylo@example.com",
            password="test1234",
            first_name="Діана",
            last_name="Бувайло",
            age=28,
            card=premium,
            subscription=monthly,
            bonus_points=200,
        )
        self.stdout.write(self.style.SUCCESS(f"Користувач створено: {user.get_full_name()}"))

        # --- Розклади для залів (Пн-Нд) ---
        self.stdout.write("Створення розкладів для залів (Пн-Нд)...")
        today = date.today()
        # Створюємо розклади на наступні 2 тижні
        hall_timeslots = []
        for week_offset in range(2):
            for day_offset in range(7):  # Пн-Нд
                current_date = today + timedelta(days=week_offset * 7 + day_offset)
                month_names = {
                    1: 'Січень', 2: 'Лютий', 3: 'Березень', 4: 'Квітень',
                    5: 'Травень', 6: 'Червень', 7: 'Липень', 8: 'Серпень',
                    9: 'Вересень', 10: 'Жовтень', 11: 'Листопад', 12: 'Грудень'
                }
                month_name = month_names.get(current_date.month, '')
                
                # Різні години для різних залів
                time_slots_by_hall = {
                    "pilates_vibe": [(time(9, 0), time(10, 0)), (time(14, 0), time(15, 0)), (time(18, 0), time(19, 0))],
                    "fitness_hall": [(time(8, 0), time(9, 0)), (time(11, 0), time(12, 0)), (time(17, 0), time(18, 0))],
                    "aqua_center": [(time(9, 0), time(10, 0)), (time(11, 0), time(12, 0)), (time(15, 0), time(16, 0))],
                    "tennis_court": [(time(10, 0), time(11, 0)), (time(16, 0), time(17, 0)), (time(19, 0), time(20, 0))],
                    "volleyball_arena": [(time(9, 0), time(10, 0)), (time(13, 0), time(14, 0)), (time(18, 0), time(19, 0))],
                }
                
                for hall_key, time_slots in time_slots_by_hall.items():
                    hall = halls[hall_key]
                    for start_time, end_time in time_slots:
                        timeslot, created = TimeSlot.objects.get_or_create(
                            hall=hall,
                            day=current_date.day,
                            month=current_date.month,
                            year=current_date.year,
                            start_time=start_time,
                            end_time=end_time,
                            defaults={'month_name': month_name}
                        )
                        if created:
                            hall_timeslots.append(timeslot)
        
        self.stdout.write(self.style.SUCCESS(f"Створено {len(hall_timeslots)} timeslots для залів"))

        # --- Розклади для секцій ---
        self.stdout.write("Створення розкладів для секцій (Пн-Сб)...")
        section_timeslots = []
        for week_offset in range(2):
            for day_offset in range(6):  # Пн-Сб 
                current_date = today + timedelta(days=week_offset * 7 + day_offset)
                month_names = {
                    1: 'Січень', 2: 'Лютий', 3: 'Березень', 4: 'Квітень',
                    5: 'Травень', 6: 'Червень', 7: 'Липень', 8: 'Серпень',
                    9: 'Вересень', 10: 'Жовтень', 11: 'Листопад', 12: 'Грудень'
                }
                month_name = month_names.get(current_date.month, '')
                
                # Розклади для різних секцій
                section_schedules = {
                    "swimming_beginner": [(time(9, 0), time(10, 0)), (time(11, 0), time(12, 0))],
                    "swimming_intermediate": [(time(10, 0), time(11, 0)), (time(14, 0), time(15, 0))],
                    "fitness_beginner": [(time(8, 0), time(9, 0)), (time(17, 0), time(18, 0))],
                    "fitness_advanced": [(time(9, 0), time(10, 0)), (time(18, 0), time(19, 0))],
                    "pilates": [(time(9, 0), time(10, 0)), (time(15, 0), time(16, 0))],
                    "volleyball": [(time(13, 0), time(14, 0)), (time(19, 0), time(20, 0))],
                    "tennis": [(time(10, 0), time(11, 0)), (time(16, 0), time(17, 0))],
                }
                
                for section_key, time_slots in section_schedules.items():
                    section = sections[section_key]
                    for start_time, end_time in time_slots:
                        # Отримуємо або створюємо timeslot для залу секції
                        hall = section.hall
                        timeslot, created = TimeSlot.objects.get_or_create(
                            hall=hall,
                            day=current_date.day,
                            month=current_date.month,
                            year=current_date.year,
                            start_time=start_time,
                            end_time=end_time,
                            defaults={'month_name': month_name}
                        )
                        
                        # Створюємо SectionSchedule, якщо ще не існує
                        schedule, created = SectionSchedule.objects.get_or_create(
                            section=section,
                            timeslot=timeslot
                        )
                        if created:
                            section_timeslots.append(timeslot)
        
        self.stdout.write(self.style.SUCCESS(f"Створено розклади для секцій"))

        # --- Бронювання для тестування (для секції Плавання) ---
        self.stdout.write("Створення тестових бронювань для секції Плавання...")
        swimming_section = sections["swimming_beginner"]
        # Знаходимо timeslot на 9:00-10:00 (10 вільних місць)
        # та timeslot на 11:00-12:00 (1 вільне місце - 9 вже заброньовано)
        
        # Знаходимо перший timeslot для секції (9:00-10:00)
        first_timeslot = None
        second_timeslot = None
        
        for schedule in SectionSchedule.objects.filter(section=swimming_section).select_related('timeslot'):
            ts = schedule.timeslot
            if ts.start_time == time(9, 0) and ts.end_time == time(10, 0):
                first_timeslot = ts
            elif ts.start_time == time(11, 0) and ts.end_time == time(12, 0):
                second_timeslot = ts
        
        if first_timeslot and second_timeslot:
            # Для другого timeslot (11:00-12:00) створюємо 9 бронювань (залишається 1 місце)
            for i in range(9):
                Reservation.objects.create(
                    customer=user,
                    hall=swimming_section.hall,
                    section=swimming_section,
                    timeslot=second_timeslot,
                    reservation_status=Reservation.STATUS_CONFIRMED,
                    payment_status=Reservation.PAYMENT_PAID,
                    price=swimming_section.price,
                    seats=1
                )
            self.stdout.write(self.style.SUCCESS(
                f"Створено 9 бронювань для {swimming_section} на {second_timeslot.start_time}-{second_timeslot.end_time} "
                f"(залишилось 1 місце з {swimming_section.seats_limit})"
            ))

        self.stdout.write(self.style.SUCCESS("\nВсі дані успішно створено!"))
        self.stdout.write(self.style.SUCCESS(f"Адмін: {admin.get_full_name()} (username: admin, password: admin123)"))
        self.stdout.write(self.style.SUCCESS(f"Користувач: {user.get_full_name()} (email: {user.email}, password: test1234)"))
