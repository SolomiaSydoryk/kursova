from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    CustomUser, Card, Subscription, Trainer,
    Hall, Section, TimeSlot, Reservation, Notification, SectionSchedule
)


class SectionScheduleInline(admin.TabularInline):
    model = SectionSchedule
    extra = 1


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'hall', 'sport_type', 'preparation_level', 'trainer', 'seats_limit')
    inlines = [SectionScheduleInline]


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


admin.site.register([Trainer, Hall, TimeSlot, Reservation, Notification])
