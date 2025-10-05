from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import Reservation
from api.services.loyalty import LoyaltyService

@receiver(post_save, sender=Reservation)
def reservation_post_save(_sender, instance: Reservation, _created, **_kwargs):
    if instance.payment_status == Reservation.PAYMENT_PAID:
        if not getattr(instance, 'points_awarded', False):
            LoyaltyService.award_points_for_reservation(instance)
            instance.points_awarded = True
            instance.save(update_fields=['points_awarded'])
