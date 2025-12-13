# Generated manually for test data

from django.db import migrations
from datetime import date, time, timedelta


def get_month_name_uk(month):
    """Повертає назву місяця українською"""
    month_names = {
        1: 'Січень', 2: 'Лютий', 3: 'Березень', 4: 'Квітень',
        5: 'Травень', 6: 'Червень', 7: 'Липень', 8: 'Серпень',
        9: 'Вересень', 10: 'Жовтень', 11: 'Листопад', 12: 'Грудень'
    }
    return month_names.get(month, '')


def create_test_timeslots(apps, schema_editor):
    TimeSlot = apps.get_model('api', 'TimeSlot')
    Hall = apps.get_model('api', 'Hall')
    Section = apps.get_model('api', 'Section')
    SectionSchedule = apps.get_model('api', 'SectionSchedule')

    # Отримуємо зали
    halls = Hall.objects.all()
    if not halls.exists():
        return  # Якщо немає залів, не створюємо timeslots

    # Створюємо timeslots на наступні 30 днів для кожного залу
    today = date.today()
    
    for hall in halls:
        # Створюємо timeslots для залу на наступні 30 днів
        for day_offset in range(30):
            current_date = today + timedelta(days=day_offset)
            
            # Створюємо кілька часових слотів на день (9:00-10:00, 10:00-11:00, 14:00-15:00, 18:00-19:00)
            time_slots = [
                (time(9, 0), time(10, 0)),
                (time(10, 0), time(11, 0)),
                (time(14, 0), time(15, 0)),
                (time(18, 0), time(19, 0)),
            ]
            
            for start_time, end_time in time_slots:
                # Перевіряємо, чи не існує вже такий timeslot
                if not TimeSlot.objects.filter(
                    hall=hall,
                    day=current_date.day,
                    month=current_date.month,
                    year=current_date.year,
                    start_time=start_time,
                    end_time=end_time
                ).exists():
                    timeslot = TimeSlot.objects.create(
                        hall=hall,
                        day=current_date.day,
                        month=current_date.month,
                        month_name=get_month_name_uk(current_date.month),
                        year=current_date.year,
                        start_time=start_time,
                        end_time=end_time
                    )
                    
                    # Для секцій створюємо SectionSchedule для деяких timeslots
                    sections = Section.objects.filter(hall=hall)
                    for section in sections:
                        # Додаємо розклад для секцій на перші 3 дні тижня (Пн-Ср) в ранкові години
                        if current_date.weekday() < 3 and start_time == time(9, 0):
                            if not SectionSchedule.objects.filter(section=section, timeslot=timeslot).exists():
                                SectionSchedule.objects.create(section=section, timeslot=timeslot)


def reverse_test_timeslots(apps, schema_editor):
    TimeSlot = apps.get_model('api', 'TimeSlot')
    # Видаляємо всі timeslots, створені для тестування
    # (можна залишити порожнім, якщо не хочете видаляти дані)
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_rename_free_seats_section_seats_limit_and_more'),
    ]

    operations = [
        migrations.RunPython(create_test_timeslots, reverse_test_timeslots),
    ]

