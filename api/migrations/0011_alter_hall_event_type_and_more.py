from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_change_bonus_points_to_decimal'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hall',
            name='event_type',
            field=models.CharField(blank=True, choices=[('fitness', 'Фітнес'), ('swimming', 'Плавання'), ('pilates', 'Пілатес'), ('volleyball', 'Волейбол'), ('tennis', 'Теніс'), ('yoga', 'Йога')], max_length=100),
        ),
        migrations.AlterField(
            model_name='section',
            name='preparation_level',
            field=models.CharField(choices=[('beginner', 'Початковий'), ('intermediate', 'Середній'), ('advanced', 'Просунутий')], default='beginner', max_length=20),
        ),
        migrations.AlterField(
            model_name='section',
            name='sport_type',
            field=models.CharField(choices=[('fitness', 'Фітнес'), ('swimming', 'Плавання'), ('pilates', 'Пілатес'), ('volleyball', 'Волейбол'), ('tennis', 'Теніс'), ('yoga', 'Йога')], default='fitness', max_length=50),
        ),
        migrations.AlterField(
            model_name='subscription',
            name='type',
            field=models.CharField(choices=[('single', 'Single'), ('monthly', 'Monthly')], max_length=20),
        ),
    ]
