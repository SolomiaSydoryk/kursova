from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.contrib.auth.models import AbstractUser


# -----------------------
# Custom user (Customer)
# -----------------------
def user_photo_upload_path(instance, filename):
    """Генерує унікальний шлях для фото користувача"""
    import uuid
    import os
    # Отримуємо розширення файлу
    ext = filename.split('.')[-1] if '.' in filename else 'jpg'
    # Генеруємо унікальну назву файлу
    new_filename = f"{uuid.uuid4()}.{ext}"
    print(f"=== user_photo_upload_path CALLED ===")
    print(f"Original filename: {filename}")
    print(f"New filename: {new_filename}")
    print(f"Full path: user_photos/{new_filename}")
    return f'user_photos/{new_filename}'


class CustomUser(AbstractUser):
    # name/surname використовуємо first_name/last_name від AbstractUser
    age = models.PositiveIntegerField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    photo = models.ImageField(upload_to=user_photo_upload_path, blank=True, null=True)
    bonus_points = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    subscription = models.ForeignKey('Subscription', on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')
    card = models.ForeignKey('Card', on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')

    def __str__(self):
        return self.get_full_name() or self.username


# -----------------------
# Card (Loyalty card)
# -----------------------
class Card(models.Model):
    TYPE_STANDARD = 'standard'
    TYPE_PREMIUM = 'premium'
    TYPE_CHOICES = [
        (TYPE_STANDARD, 'Standard'),
        (TYPE_PREMIUM, 'Premium'),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_STANDARD)
    benefits = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    bonus_multiplier = models.FloatField(default=0.01)  # Множник для нарахування бонусів (0.01 = 1%)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} (x{self.bonus_multiplier})"


# -----------------------
# Subscription (Абонемент)
# -----------------------
class Subscription(models.Model):
    TYPE_SINGLE = 'single'
    TYPE_MONTHLY = 'monthly'
    TYPE_CHOICES = [
        (TYPE_SINGLE, 'Single'),
        (TYPE_MONTHLY, 'Monthly'),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    duration_days = models.PositiveIntegerField()  
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='active')  # active/inactive
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} ({self.duration_days}d) - {self.status}"


# -----------------------
# UserSubscription (Придбані абонементи користувачів)
# -----------------------
class UserSubscription(models.Model):
    """Модель для зберігання придбаних абонементів користувачів"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_subscriptions')
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='user_subscriptions')
    purchased_at = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField()  
    end_date = models.DateField()  
    is_active = models.BooleanField(default=True) 
    is_used = models.BooleanField(default=False)  # Для разових абонементів - чи використаний
    used_at = models.DateTimeField(null=True, blank=True)  # Коли був використаний (для разових)
    
    class Meta:
        ordering = ['-purchased_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.subscription.get_type_display()} ({self.start_date} to {self.end_date})"
    
    def is_valid(self):
        """Перевіряє, чи абонемент дійсний на даний момент"""
        today = timezone.now().date()
        if not self.is_active:
            return False
        if self.subscription.type == Subscription.TYPE_SINGLE:
            # Для разового - перевіряємо, чи не використаний і чи не минув термін
            return not self.is_used and self.end_date >= today
        else:
            # Для місячного - перевіряємо тільки термін дії
            # start_date може бути в минулому (якщо абонемент куплений раніше), тому перевіряємо тільки end_date
            return today <= self.end_date
    
    def can_be_used(self):
        """Перевіряє, чи можна використати абонемент"""
        if not self.is_valid():
            return False
        if self.subscription.type == Subscription.TYPE_SINGLE:
            return not self.is_used
        return True  # Місячний можна використовувати багато разів


# -----------------------
# Trainer
# -----------------------
class Trainer(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    specialization = models.CharField(max_length=200, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()

# -----------------------
# Hall
# -----------------------
class Hall(models.Model):
    EVENT_TYPE_CHOICES = [
        ('fitness', 'Фітнес'),
        ('swimming', 'Плавання'),
        ('pilates', 'Пілатес'),
        ('volleyball', 'Волейбол'),
        ('tennis', 'Теніс'),
        ('yoga', 'Йога'),
    ]
    
    # hallId implicit (id)
    name = models.CharField(max_length=200)
    room_number = models.CharField(max_length=50, blank=True)
    event_type = models.CharField(max_length=100, choices=EVENT_TYPE_CHOICES, blank=True)  
    capacity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.room_number})"

def list_available_sections(self):
        return self.sections.filter()  # related_name в Section


# -----------------------
# TimeSlot
# -----------------------
class TimeSlot(models.Model):
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, null=True, blank=True)

    day = models.PositiveIntegerField()
    month = models.PositiveIntegerField()
    month_name = models.CharField(max_length=20, blank=True)
    year = models.PositiveIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        unique_together = ('hall', 'day', 'month', 'year', 'start_time', 'end_time')
        ordering = ['year', 'month', 'day', 'start_time']

    def __str__(self):
        return f"{self.day}.{self.month}.{self.year} {self.start_time}-{self.end_time} ({self.hall.name})"

    @property
    def date(self):
        """Повертає date об'єкт для зручності."""
        from datetime import date
        return date(self.year, self.month, self.day)

    def check_availability(self, hall=None, section=None):
        """Повертає True якщо на цей timeslot є вільні місця (з урахуванням hall/section)."""
        if section:
            confirmed = Reservation.objects.filter(section=section, timeslot=self, reservation_status=Reservation.STATUS_CONFIRMED).count()
            return confirmed < section.seats_limit
        if hall:
            # Для залів - перевіряємо чи є будь-яке бронювання (бронюємо весь зал)
            existing = Reservation.objects.filter(
                hall=hall, 
                timeslot=self, 
                reservation_status__in=[Reservation.STATUS_CONFIRMED, Reservation.STATUS_PENDING]
            ).exists()
            return not existing
        return True


# -----------------------
# Section
# -----------------------
class Section(models.Model):
    LEVEL_CHOICES = [
        ('beginner', 'Початковий'),
        ('intermediate', 'Середній'),
        ('advanced', 'Просунутий'),
    ]

    SPORT_CHOICES = [
        ('fitness', 'Фітнес'),
        ('swimming', 'Плавання'),
        ('pilates', 'Пілатес'),
        ('volleyball', 'Волейбол'),
        ('tennis', 'Теніс'),
        ('yoga', 'Йога'),
    ]

    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='sections')
    trainer = models.ForeignKey(Trainer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sections')
    min_age = models.PositiveIntegerField(null=True, blank=True)
    max_age = models.PositiveIntegerField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    preparation_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    sport_type = models.CharField(max_length=50, choices=SPORT_CHOICES, default='fitness')
    seats_limit = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.sport_type} ({self.preparation_level}) — {self.hall.name}"


    def check_age_eligibility(self, user_age):
        if user_age is None:
            return True
        if self.min_age and user_age < self.min_age:
            return False
        if self.max_age and user_age > self.max_age:
            return False
        return True

    def list_available_sections(self):
        return self


class SectionSchedule(models.Model):
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, related_name='schedules'
    )
    timeslot = models.ForeignKey(
        TimeSlot, on_delete=models.CASCADE, related_name='section_schedules'
    )

    class Meta:
        unique_together = ('section', 'timeslot')

    def __str__(self):
        return f"{self.section} @ {self.timeslot}"


# -----------------------
# Reservation (Booking)
# -----------------------
class Reservation(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    PAYMENT_UNPAID = 'unpaid'
    PAYMENT_PAID = 'paid'
    PAYMENT_ERROR = 'error'
    PAYMENT_CHOICES = [
        (PAYMENT_UNPAID, 'Unpaid'),
        (PAYMENT_PAID, 'Paid'),
        (PAYMENT_ERROR, 'Error'),
    ]

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='reservations')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations')
    timeslot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='reservations')
    reservation_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default=PAYMENT_UNPAID)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    seats = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    points_awarded = models.BooleanField(default=False)
    # Поле для відстеження використаного абонемента
    used_subscription = models.ForeignKey('UserSubscription', on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Res#{self.id} {self.customer} at {self.timeslot}"

    def clean(self):
        """Валідація перед збереженням"""
        if self.section:
            capacity = self.section.seats_limit
            confirmed = Reservation.objects.filter(section=self.section, timeslot=self.timeslot, reservation_status=self.STATUS_CONFIRMED).exclude(pk=self.pk).count()
            if confirmed + self.seats > capacity:
                raise ValidationError("Недостатньо вільних місць у секції на цей час.")
        else:
            # Для залів - перевіряємо чи вже є бронювання на цей день (бронюємо весь зал)
            existing = Reservation.objects.filter(
                hall=self.hall, 
                timeslot=self.timeslot, 
                reservation_status__in=[self.STATUS_CONFIRMED, self.STATUS_PENDING]
            ).exclude(pk=self.pk).exists()
            
            if existing:
                raise ValidationError("Зал вже заброньований на цей день.")

    def save(self, *args, **kwargs):
        """Безпечне збереження з транзакцією для уникнення race conditions."""
        self.full_clean()
        with transaction.atomic():
            if self.section:
                qs = Reservation.objects.select_for_update().filter(section=self.section, timeslot=self.timeslot, reservation_status=self.STATUS_CONFIRMED).exclude(pk=self.pk)
                confirmed = qs.count()
                if confirmed + self.seats > self.section.seats_limit:
                    raise ValidationError("Недостатньо вільних місць (під час збереження).")
            else:
                # Для залів - перевіряємо чи вже є бронювання на цей день
                existing = Reservation.objects.select_for_update().filter(
                    hall=self.hall, 
                    timeslot=self.timeslot, 
                    reservation_status__in=[self.STATUS_CONFIRMED, self.STATUS_PENDING]
                ).exclude(pk=self.pk).exists()
                
                if existing:
                    raise ValidationError("Зал вже заброньований на цей день (під час збереження).")
            super().save(*args, **kwargs)


# -----------------------
# Notification
# -----------------------
class Notification(models.Model):
    TYPE_REMINDER = 'reminder'
    TYPE_PROMO = 'promo'
    TYPE_BONUS = 'bonus'
    TYPE_CHOICES = [
        (TYPE_REMINDER, 'Reminder'),
        (TYPE_PROMO, 'Promo'),
        (TYPE_BONUS, 'Bonus'),
    ]

    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.TextField()
    date_time = models.DateTimeField(auto_now_add=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')

    def __str__(self):
        return f"{self.get_notification_type_display()} -> {self.customer}"
