from rest_framework import serializers
from api.models import Reservation

class ReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = '__all__'

    def validate(self, data):
        user = self.context['request'].user
        section = data.get('section')
        hall = data.get('hall')
        timeslot = data.get('timeslot')
        seats = data.get('seats', 1)

        # перевірка віку
        if section and user.age is not None:
            if section.min_age and user.age < section.min_age:
                raise serializers.ValidationError("User too young for this section.")
            if section.max_age and user.age > section.max_age:
                raise serializers.ValidationError("User too old for this section.")

        # доступність
        if section:
            confirmed = Reservation.objects.filter(section=section, timeslot=timeslot, reservation_status=Reservation.STATUS_CONFIRMED).count()
            if confirmed + seats > section.free_seats:
                raise serializers.ValidationError("Not enough seats in section.")
        else:
            confirmed = Reservation.objects.filter(hall=hall, timeslot=timeslot, reservation_status=Reservation.STATUS_CONFIRMED).count()
            if confirmed + seats > hall.capacity:
                raise serializers.ValidationError("Not enough seats in hall.")

        return data
