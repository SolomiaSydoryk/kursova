from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import ReservationViewSet, BookingCreateView, MyLoyaltyView, RedeemPointsView

router = DefaultRouter()
router.register(r'reservations', ReservationViewSet, basename='reservation')

urlpatterns = [
    path('', include(router.urls)),
    path("bookings/create/", BookingCreateView.as_view(), name="booking_create"),
    path('loyalty/me/', MyLoyaltyView.as_view(), name='my_loyalty'),
    path('loyalty/redeem/', RedeemPointsView.as_view(), name='loyalty_redeem'),
]

