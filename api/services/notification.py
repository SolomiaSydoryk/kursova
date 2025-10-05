import logging
from abc import ABC, abstractmethod
from django.core.mail import send_mail
from django.conf import settings
from api.models import Notification
from typing import List, Optional
from django.utils import timezone

logger = logging.getLogger(__name__)

class Notifier(ABC):
    @abstractmethod
    def send(self, notification: Notification):
        pass

class EmailNotifier(Notifier):
    def send(self, notification: Notification):
        if not notification.customer.email:
            logger.warning("EmailNotifier: user has no email: %s", notification.customer)
            return
        subject = f"[SportsBooking] {notification.get_notification_type_display()}"
        # простий send_mail
        send_mail(
            subject,
            notification.message,
            settings.DEFAULT_FROM_EMAIL,
            [notification.customer.email],
            fail_silently=True
        )
        logger.info("Email sent to %s: %s", notification.customer.email, subject)

class SMSNotifier(Notifier):
    def send(self, notification: Notification):
        logger.info("SMS to %s: %s", notification.customer, notification.message)

class LogNotifier(Notifier):
    def send(self, notification: Notification):
        logger.info("[LOG] Notify %s (%s): %s", notification.customer, notification.notification_type, notification.message)

class NotificationService:
    def __init__(self, notifiers: Optional[List[Notifier]] = None):
        if notifiers is None:
            notifiers = [LogNotifier()]
        self._notifiers: List[Notifier] = notifiers

    def notify(self, notification: Notification):
        """Відправити одне повідомлення через усі канали."""
        for n in self._notifiers:
            try:
                n.send(notification)
            except Exception:
                import logging
                logging.exception("Notifier failed: %s", n.__class__.__name__)

def create_and_notify(customer, notification_type, message, send_at=None, notifiers=None):
    """
    Створює Notification. Якщо send_at <= now -> відправляє одразу.
    Якщо send_at в майбутньому -> лишає запис для подальшої відправки.
    """
    now = timezone.now()
    notification = Notification.objects.create(
        customer=customer,
        notification_type=notification_type,
        message=message,
        send_at=send_at or now
    )

    if notification.send_at and notification.send_at <= now:
        svc = NotificationService(notifiers=notifiers)
        svc.notify(notification)
        notification.is_sent = True
        notification.sent_at = timezone.now()
        notification.save(update_fields=['is_sent', 'sent_at'])

    return notification
