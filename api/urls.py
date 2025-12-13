from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from api.views import (
    ReservationViewSet, BookingCreateView, MyLoyaltyView,
    RedeemPointsView, SectionTimeslotsView, SectionScheduleViewSet,
    HallViewSet, SectionViewSet, TrainerViewSet, AvailableTimeslotsView,
    RegisterView, ProfileView, MyReservationsView, NotificationsView,
    NotificationReadView, MarkAllNotificationsReadView, EmailLoginView,
    SubscriptionsListView, SubscriptionPurchaseView, MySubscriptionsView
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
    
    # Timeslots
    path('sections/<int:section_id>/timeslots/', SectionTimeslotsView.as_view(), name='section_timeslots'),
    path('available-timeslots/', AvailableTimeslotsView.as_view(), name='available_timeslots'),
    
    # Лояльність
    path('loyalty/me/', MyLoyaltyView.as_view(), name='my_loyalty'),
    path('loyalty/redeem/', RedeemPointsView.as_view(), name='loyalty_redeem'),
    
    # Сповіщення
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    path('notifications/<int:notification_id>/read/', NotificationReadView.as_view(), name='notification_read'),
    path('notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),
    
    # Абонементи
    path('subscriptions/', SubscriptionsListView.as_view(), name='subscriptions_list'),
    path('subscriptions/<int:subscription_id>/purchase/', SubscriptionPurchaseView.as_view(), name='subscription_purchase'),
    path('subscriptions/my/', MySubscriptionsView.as_view(), name='my_subscriptions'),
]
