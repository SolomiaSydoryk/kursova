from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    CustomUser, Card, Subscription, Trainer,
    Hall, Section, TimeSlot, Reservation, Notification
)


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'price', 'bonus_multiplier')
    search_fields = ('type',)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'duration_days', 'price', 'status')


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'first_name', 'last_name', 'bonus_points', 'card', 'subscription', 'is_staff')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Loyalty', {'fields': ('bonus_points', 'card', 'subscription')}),
    )


admin.site.register([Trainer, Hall, Section, TimeSlot, Reservation, Notification])
