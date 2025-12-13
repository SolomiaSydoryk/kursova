# Generated manually

from django.db import migrations, models
import decimal


def update_bonus_multipliers(apps, schema_editor):
    """Оновлюємо bonus_multiplier для всіх існуючих карток"""
    Card = apps.get_model('api', 'Card')
    # Оновлюємо всі картки: якщо bonus_multiplier >= 1.0, встановлюємо 0.01
    Card.objects.filter(bonus_multiplier__gte=1.0).update(bonus_multiplier=0.01)


def reverse_update_bonus_multipliers(apps, schema_editor):
    """Відкат змін"""
    Card = apps.get_model('api', 'Card')
    # Повертаємо значення назад (але це не ідеально, бо не знаємо оригінальні значення)
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_alter_customuser_photo_usersubscription_and_more'),
    ]

    operations = [
        # Змінюємо bonus_multiplier default з 1.0 на 0.01
        migrations.AlterField(
            model_name='card',
            name='bonus_multiplier',
            field=models.FloatField(default=0.01, help_text='Множник для нарахування бонусів (0.01 = 1%)'),
        ),
        # Прибираємо TYPE_CORPORATE з choices
        migrations.AlterField(
            model_name='card',
            name='type',
            field=models.CharField(
                choices=[('standard', 'Standard'), ('premium', 'Premium')],
                default='standard',
                max_length=20
            ),
        ),
        # Оновлюємо існуючі картки
        migrations.RunPython(update_bonus_multipliers, reverse_update_bonus_multipliers),
    ]

