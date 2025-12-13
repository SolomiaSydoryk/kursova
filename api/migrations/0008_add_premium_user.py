# Generated manually - додаємо тестового користувача з Premium карткою

from django.db import migrations
from django.contrib.auth import get_user_model
from decimal import Decimal

def create_premium_user(apps, schema_editor):
    """Створюємо тестового користувача з Premium карткою"""
    CustomUser = apps.get_model('api', 'CustomUser')
    Card = apps.get_model('api', 'Card')
    
    # Отримуємо або створюємо Premium картку
    premium_card, _ = Card.objects.get_or_create(
        type='premium',
        defaults={
            'benefits': '50% знижка на плавання, 1% бонусні бали від зниженої суми',
            'price': Decimal('150.00'),
            'bonus_multiplier': 0.01
        }
    )
    
    # Створюємо користувача з Premium карткою (якщо ще не існує)
    if not CustomUser.objects.filter(email='premium@test.com').exists():
        premium_user = CustomUser.objects.create_user(
            email='premium@test.com',
            username='premium_user',
            password='testpass123',
            first_name='Premium',
            last_name='User',
            age=25,
            phone='+380501234567',
            card=premium_card,
            bonus_points=0
        )
        print(f"Створено користувача з Premium карткою: {premium_user.email}")

def reverse_premium_user(apps, schema_editor):
    """Видаляємо тестового користувача"""
    CustomUser = apps.get_model('api', 'CustomUser')
    CustomUser.objects.filter(email='premium@test.com').delete()

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_remove_corporate_card_and_fix_bonus_multiplier'),
    ]

    operations = [
        migrations.RunPython(create_premium_user, reverse_premium_user),
    ]

