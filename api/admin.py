from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Card, Subscription, Trainer,
    Hall, Section, TimeSlot, Reservation, Notification
)

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    pass

admin.site.register([Card, Subscription, Trainer, Hall, Section, TimeSlot, Reservation, Notification])