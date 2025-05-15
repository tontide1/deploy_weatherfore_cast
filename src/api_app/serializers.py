from rest_framework import serializers
from .models import Weather, PredictWeather



class WeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Weather
        fields = "__all__"


class PredictWeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictWeather
        fields = "__all__"