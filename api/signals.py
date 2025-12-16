from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import Reservation, Section, CustomUser, Notification
from api.services.loyalty import LoyaltyService
from api.services.notification import create_and_notify


@receiver(post_save, sender=Section)
def section_post_save(sender, instance: Section, created, **kwargs):
    """
    Коли адміністратор створює нову секцію, всім користувачам надсилається сповіщення.
    Використовуємо pub/sub через Django signals.
    """
    if created:  
        sport_type_map = {
            'fitness': 'Фітнес',
            'swimming': 'Плавання',
            'pilates': 'Пілатес',
            'volleyball': 'Волейбол',
            'tennis': 'Теніс',
            'yoga': 'Йога',
        }
        level_map = {
            'beginner': 'Початковий рівень',
            'intermediate': 'Середній рівень',
            'advanced': 'Просунутий рівень',
        }
        
        sport_type = sport_type_map.get(instance.sport_type, instance.sport_type.capitalize() if instance.sport_type else "")
        preparation_level = level_map.get(instance.preparation_level, instance.preparation_level.capitalize() if instance.preparation_level else "")
        section_name = f"{sport_type} ({preparation_level})"
        hall_name = instance.hall.name if instance.hall else "невідомий зал"
        trainer_name = f"{instance.trainer.first_name} {instance.trainer.last_name}".strip() if instance.trainer else "тренер не призначений"
        
        message = f"Додано нову секцію {section_name} у залі {hall_name} з тренером {trainer_name}."
        
        # Створюємо сповіщення для всіх активних користувачів
        users = CustomUser.objects.filter(is_active=True, is_staff=False)
        for user in users:
            create_and_notify(
                user,
                Notification.TYPE_PROMO,
                message
            )
