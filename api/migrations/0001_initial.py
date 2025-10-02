import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Card',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('standard', 'Standard'), ('premium', 'Premium'), ('corporate', 'Corporate')], default='standard', max_length=20)),
                ('benefits', models.TextField(blank=True)),
                ('price', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                ('bonus_multiplier', models.FloatField(default=1.0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='Hall',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('room_number', models.CharField(blank=True, max_length=50)),
                ('event_type', models.CharField(blank=True, max_length=100)),
                ('capacity', models.PositiveIntegerField(default=0)),
                ('price', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                ('is_active', models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name='Subscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('single', 'Single'), ('monthly', 'Monthly'), ('corporate', 'Corporate')], max_length=20)),
                ('duration_days', models.PositiveIntegerField()),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('description', models.TextField(blank=True)),
                ('status', models.CharField(default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='Trainer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('first_name', models.CharField(max_length=100)),
                ('last_name', models.CharField(blank=True, max_length=100)),
                ('specialization', models.CharField(blank=True, max_length=200)),
                ('age', models.PositiveIntegerField(blank=True, null=True)),
                ('experience_years', models.PositiveIntegerField(default=0)),
                ('phone', models.CharField(blank=True, max_length=20)),
            ],
        ),
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('age', models.PositiveIntegerField(blank=True, null=True)),
                ('phone', models.CharField(blank=True, max_length=20, null=True)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='user_photos/')),
                ('bonus_points', models.IntegerField(default=0)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
                ('card', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customers', to='api.card')),
                ('subscription', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customers', to='api.subscription')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'abstract': False,
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('reminder', 'Reminder'), ('promo', 'Promo'), ('bonus', 'Bonus')], max_length=20)),
                ('message', models.TextField()),
                ('date_time', models.DateTimeField(auto_now_add=True)),
                ('is_read', models.BooleanField(default=False)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Section',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('min_age', models.PositiveIntegerField(blank=True, null=True)),
                ('max_age', models.PositiveIntegerField(blank=True, null=True)),
                ('price', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                ('preparation_level', models.CharField(blank=True, max_length=100)),
                ('sport_type', models.CharField(blank=True, max_length=100)),
                ('free_seats', models.PositiveIntegerField(default=0)),
                ('hall', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sections', to='api.hall')),
                ('trainer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sections', to='api.trainer')),
            ],
        ),
        migrations.CreateModel(
            name='TimeSlot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day', models.PositiveIntegerField()),
                ('month', models.PositiveIntegerField()),
                ('month_name', models.CharField(blank=True, max_length=20)),
                ('year', models.PositiveIntegerField()),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
            ],
            options={
                'ordering': ['year', 'month', 'day', 'start_time'],
                'unique_together': {('day', 'month', 'year', 'start_time', 'end_time')},
            },
        ),
        migrations.CreateModel(
            name='Reservation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reservation_status', models.CharField(choices=[('pending', 'Pending'), ('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('payment_status', models.CharField(choices=[('unpaid', 'Unpaid'), ('paid', 'Paid'), ('error', 'Error')], default='unpaid', max_length=20)),
                ('price', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                ('seats', models.PositiveIntegerField(default=1)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reservations', to=settings.AUTH_USER_MODEL)),
                ('hall', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reservations', to='api.hall')),
                ('section', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reservations', to='api.section')),
                ('timeslot', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reservations', to='api.timeslot')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
