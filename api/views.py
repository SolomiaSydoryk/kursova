from rest_framework import viewsets, permissions
from api.models import Reservation
from api.serializers import ReservationSerializer

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Автоматично прив’язує користувача до бронювання
        serializer.save(customer=self.request.user)
