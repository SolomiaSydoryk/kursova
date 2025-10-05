from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Notification
from api.services.notification import NotificationService
from api.services.notification import EmailNotifier, SMSNotifier, LogNotifier

class Command(BaseCommand):
    help = "Send pending notifications with send_at <= now (safe, idempotent)."

    def handle(self, *args, **options):
        now = timezone.now()
        qs = Notification.objects.filter(is_sent=False, send_at__lte=now)
        if not qs.exists():
            self.stdout.write("No pending notifications to send.")
            return

        svc = NotificationService(notifiers=[EmailNotifier(), SMSNotifier(), LogNotifier()])
        sent = 0
        for n in qs:
            try:
                svc.notify(n)
                n.is_sent = True
                n.sent_at = timezone.now()
                n.save(update_fields=['is_sent', 'sent_at'])
                sent += 1
            except Exception:
                self.stderr.write(f"Failed to send notification id={n.id}")
        self.stdout.write(self.style.SUCCESS(f"Sent {sent} notifications."))
