from api.serializers import ReservationSerializer
from api.services.booking import BookingService
from django.core.exceptions import ValidationError
from api.models import Hall, Section, TimeSlot, Reservation
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status, viewsets
from api.serializers import UserLoyaltySerializer
from api.services.loyalty import LoyaltyService


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Автоматично прив’язує користувача до бронювання
        serializer.save(customer=self.request.user)


class BookingCreateView(APIView):
    def post(self, request):
        customer = request.user
        hall_id = request.data.get("hall")
        section_id = request.data.get("section")
        timeslot_id = request.data.get("timeslot")
        seats = request.data.get("seats", 1)

        hall = None
        section = None
        timeslot = None

        if hall_id:
            hall = Hall.objects.get(id=hall_id)
        if section_id:
            section = Section.objects.get(id=section_id)
        if timeslot_id:
            timeslot = TimeSlot.objects.get(id=timeslot_id)

        try:
            booking = BookingService.create_booking(customer, hall, section, timeslot, seats)
            return Response({"message": "Бронювання створено", "id": booking.id}, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MyLoyaltyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserLoyaltySerializer(request.user)
        return Response(serializer.data)

class RedeemPointsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        reservation_id = request.data.get('reservation')
        points = int(request.data.get('points', 0))
        try:
            reservation = Reservation.objects.get(pk=reservation_id, customer=user)
        except Reservation.DoesNotExist:
            return Response({'detail': 'Reservation not found'}, status=status.HTTP_404_NOT_FOUND)

        result = LoyaltyService.redeem_points_for_reservation(user, reservation, points)
        return Response(result, status=status.HTTP_200_OK)
