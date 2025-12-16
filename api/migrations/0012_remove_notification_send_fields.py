# Generated manually - видаляємо невикористовувані поля send_at, is_sent, sent_at з моделі Notification

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_alter_hall_event_type_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='notification',
            name='is_sent',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='send_at',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='sent_at',
        ),
    ]

