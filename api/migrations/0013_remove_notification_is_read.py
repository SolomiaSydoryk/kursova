# Generated manually - видаляємо невикористовуване поле is_read з моделі Notification

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_remove_notification_send_fields'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='notification',
            name='is_read',
        ),
    ]

