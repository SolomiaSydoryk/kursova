# Generated manually

from django.db import migrations, models
import decimal


def convert_bonus_points_to_decimal(apps, schema_editor):
    """Конвертуємо існуючі bonus_points з int в Decimal"""
    CustomUser = apps.get_model('api', 'CustomUser')
    # Оновлюємо всіх користувачів: конвертуємо int в Decimal
    for user in CustomUser.objects.all():
        if user.bonus_points is not None:
            # Якщо bonus_points це int, конвертуємо в Decimal
            if isinstance(user.bonus_points, int):
                user.bonus_points = decimal.Decimal(str(user.bonus_points))
            elif isinstance(user.bonus_points, float):
                user.bonus_points = decimal.Decimal(str(user.bonus_points))
            user.save(update_fields=['bonus_points'])


def reverse_convert_bonus_points(apps, schema_editor):
    """Відкат змін - конвертуємо Decimal назад в int"""
    CustomUser = apps.get_model('api', 'CustomUser')
    for user in CustomUser.objects.all():
        if user.bonus_points is not None:
            # Округлюємо Decimal до int
            user.bonus_points = int(float(user.bonus_points))
            user.save(update_fields=['bonus_points'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_alter_card_bonus_multiplier'),
    ]

    operations = [
        # Змінюємо bonus_points з IntegerField на DecimalField
        migrations.AlterField(
            model_name='customuser',
            name='bonus_points',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=10),
        ),
        # Конвертуємо існуючі дані
        migrations.RunPython(convert_bonus_points_to_decimal, reverse_convert_bonus_points),
    ]

