from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from api.views import (
    ReservationViewSet, BookingCreateView, MyLoyaltyView,
    RedeemPointsView, SectionTimeslotsView, SectionScheduleViewSet,
    HallViewSet, SectionViewSet, TrainerViewSet, AvailableTimeslotsView,
    RegisterView, ProfileView, MyReservationsView, NotificationsView,
    EmailLoginView, SubscriptionsListView, SubscriptionPurchaseView, MySubscriptionsView,
    AllReservationsView, UpdateReservationStatusView, CreateTimeslotView
)

router = DefaultRouter()
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'schedule', SectionScheduleViewSet, basename='section-schedule')
router.register(r'halls', HallViewSet, basename='hall')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'trainers', TrainerViewSet, basename='trainer')

urlpatterns = [
    path('', include(router.urls)),
    
    # Аутентифікація
    path('auth/token/', obtain_auth_token, name='api_token_auth'),
    path('auth/login/', EmailLoginView.as_view(), name='email_login'),  # Вхід через email
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    
    # Бронювання
    path('bookings/create/', BookingCreateView.as_view(), name='booking_create'),
    path('bookings/my/', MyReservationsView.as_view(), name='my_reservations'),
    path('bookings/all/', AllReservationsView.as_view(), name='all_reservations'),  # Тільки для адмінів
    path('bookings/<int:reservation_id>/status/', UpdateReservationStatusView.as_view(), name='update_reservation_status'),  # Тільки для адмінів
    
    # Timeslots
    path('sections/<int:section_id>/timeslots/', SectionTimeslotsView.as_view(), name='section_timeslots'),
    path('available-timeslots/', AvailableTimeslotsView.as_view(), name='available_timeslots'),
    path('timeslots/create/', CreateTimeslotView.as_view(), name='create_timeslot'),  # Тільки для адмінів
    
    # Лояльність
    path('loyalty/me/', MyLoyaltyView.as_view(), name='my_loyalty'),
    path('loyalty/redeem/', RedeemPointsView.as_view(), name='loyalty_redeem'),
    
    # Сповіщення
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    
    # Абонементи
    path('subscriptions/', SubscriptionsListView.as_view(), name='subscriptions_list'),
    path('subscriptions/<int:subscription_id>/purchase/', SubscriptionPurchaseView.as_view(), name='subscription_purchase'),
    path('subscriptions/my/', MySubscriptionsView.as_view(), name='my_subscriptions'),
]
