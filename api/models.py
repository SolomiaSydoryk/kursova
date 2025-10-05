from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.contrib.auth.models import AbstractUser


# -----------------------
# Custom user (Customer)
# -----------------------
class CustomUser(AbstractUser):
    # name/surname використовуємо first_name/last_name від AbstractUser
    age = models.PositiveIntegerField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    photo = models.ImageField(upload_to='user_photos/', blank=True, null=True)
    bonus_points = models.IntegerField(default=0)

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
    TYPE_CORPORATE = 'corporate'
    TYPE_CHOICES = [
        (TYPE_STANDARD, 'Standard'),
        (TYPE_PREMIUM, 'Premium'),
        (TYPE_CORPORATE, 'Corporate'),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_STANDARD)
    benefits = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    bonus_multiplier = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def str(self):
        return f"{self.get_type_display()} (x{self.bonus_multiplier})"


# -----------------------
# Subscription (Абонемент)
# -----------------------
class Subscription(models.Model):
    TYPE_SINGLE = 'single'
    TYPE_MONTHLY = 'monthly'
    TYPE_CORPORATE = 'corporate'
    TYPE_CHOICES = [
        (TYPE_SINGLE, 'Single'),
        (TYPE_MONTHLY, 'Monthly'),
        (TYPE_CORPORATE, 'Corporate'),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    duration_days = models.PositiveIntegerField()   # тривалість в днях
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='active')  # active/inactive
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} ({self.duration_days}d) - {self.status}"


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
    # hallId implicit (id)
    name = models.CharField(max_length=200)
    room_number = models.CharField(max_length=50, blank=True)
    event_type = models.CharField(max_length=100, blank=True)  # Fitness, Pool, Dance
    capacity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.room_number})"

def list_available_sections(self):
        return self.sections.filter()  # related_name в Section


# -----------------------
# Section
# -----------------------
class Section(models.Model):
    # sectionId implicit (id)
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='sections')
    trainer = models.ForeignKey(Trainer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sections')
    min_age = models.PositiveIntegerField(null=True, blank=True)
    max_age = models.PositiveIntegerField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    preparation_level = models.CharField(max_length=100, blank=True)  # beginner/intermediate/advanced
    sport_type = models.CharField(max_length=100, blank=True)         # football, yoga, fitness, swimming
    free_seats = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.sport_type} - {self.preparation_level} (Hall: {self.hall.name} {self.hall.room_number})"

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


# -----------------------
# TimeSlot
# -----------------------
class TimeSlot(models.Model):
    day = models.PositiveIntegerField()
    month = models.PositiveIntegerField()
    month_name = models.CharField(max_length=20, blank=True)
    year = models.PositiveIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        unique_together = ('day', 'month', 'year', 'start_time', 'end_time')
        ordering = ['year', 'month', 'day', 'start_time']

    def __str__(self):
        return f"{self.day}.{self.month}.{self.year} {self.start_time.strftime('%H:%M')}-{self.end_time.strftime('%H:%M')}"

    def check_availability(self, hall=None, section=None):
        """Повертає True якщо на цей timeslot є вільні місця (з урахуванням hall/section)."""
        if section:
            confirmed = Reservation.objects.filter(section=section, timeslot=self, reservation_status=Reservation.STATUS_CONFIRMED).count()
            return confirmed < section.free_seats
        if hall:
            confirmed = Reservation.objects.filter(hall=hall, timeslot=self, reservation_status=Reservation.STATUS_CONFIRMED).count()
            return confirmed < hall.capacity
        return True


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

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Res#{self.id} {self.customer} at {self.timeslot}"

    def clean(self):
        """Валідація перед збереженням"""
        if self.section and self.customer.age is not None:
            if self.section.min_age and self.customer.age < self.section.min_age:
                raise ValidationError("Користувач занадто молодий для цієї секції.")
            if self.section.max_age and self.customer.age > self.section.max_age:
                raise ValidationError("Користувач занадто дорослий для цієї секції.")

        if self.section:
            capacity = self.section.free_seats
            confirmed = Reservation.objects.filter(section=self.section, timeslot=self.timeslot, reservation_status=self.STATUS_CONFIRMED).exclude(pk=self.pk).count()
            if confirmed + self.seats > capacity:
                raise ValidationError("Недостатньо вільних місць у секції на цей час.")
        else:
            capacity = self.hall.capacity
            confirmed = Reservation.objects.filter(hall=self.hall, timeslot=self.timeslot, reservation_status=self.STATUS_CONFIRMED).exclude(pk=self.pk).count()
            if confirmed + self.seats > capacity:
                raise ValidationError("Недостатньо вільних місць у залі на цей час.")

    def save(self, *args, **kwargs):
        """Безпечне збереження з транзакцією для уникнення race conditions."""
        self.full_clean()
        with transaction.atomic():
            if self.section:
                qs = Reservation.objects.select_for_update().filter(section=self.section, timeslot=self.timeslot, reservation_status=self.STATUS_CONFIRMED).exclude(pk=self.pk)
                confirmed = qs.count()
                if confirmed + self.seats > self.section.free_seats:
                    raise ValidationError("Недостатньо вільних місць (під час збереження).")
            else:
                qs = Reservation.objects.select_for_update().filter(hall=self.hall, timeslot=self.timeslot, reservation_status=self.STATUS_CONFIRMED).exclude(pk=self.pk)
                confirmed = qs.count()
                if confirmed + self.seats > self.hall.capacity:
                    raise ValidationError("Недостатньо вільних місць (під час збереження).")
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
    is_read = models.BooleanField(default=False)
    send_at = models.DateTimeField(null=True, blank=True, help_text="When to actually send this notification")
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.get_notification_type_display()} -> {self.customer}"
