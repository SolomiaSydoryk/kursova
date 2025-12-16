import logging
from api.models import Notification
from api.services.observer_pattern import NotificationManager

logger = logging.getLogger(__name__)

def create_and_notify(customer, notification_type, message):
    """
    Створює Notification і відображає його в UI одразу через Observer Pattern.
    
    Використовує Observer Pattern для сповіщення всіх підписаних спостерігачів
    (UIObserver, LogObserver тощо).
    """
    # Створюємо сповіщення в БД
    notification = Notification.objects.create(
        customer=customer,
        notification_type=notification_type,
        message=message,
    )
    
    # Сповіщаємо всіх спостерігачів через Observer Pattern
    notification_manager = NotificationManager()
    notification_manager.subject.notify_observers(notification)

    return notification
