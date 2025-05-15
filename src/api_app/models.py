from django.db import models

from dotenv import load_dotenv
from decouple import config
load_dotenv()


class Weather(models.Model):
    province = models.CharField(max_length=100, verbose_name="Province")
    time = models.DateTimeField(verbose_name="Time")
    temperature = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Temperature")
    temp_max = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Max Temperature")
    temp_min = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Min Temperature")
    precipitation = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Precipitation")
    windspeed_max = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Max Windspeed")
    uv_index_max = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Max UV Index")
    sunshine_hours = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Sunshine Hours")
    sundown_hours = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Sundown Hours")
    weather_code = models.IntegerField(verbose_name="Weather Code")
    humidity = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Humidity")
    feel_like = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Feels Like")

    class Meta:
        managed = False
        db_table = config("WEATHER_DATA_TABLE_NAME", default="weather_data")
        ordering = ["province", "time"]

    def __str__(self):
        return f'{self.province} - {self.time}: {self.temperature}'
    

class PredictWeather(models.Model):
    province = models.CharField(max_length=100, verbose_name="Province")
    time = models.DateField(verbose_name="time")
    temp_max = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Max Temperature")
    temp_min = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Min Temperature")
    weather_code = models.IntegerField(verbose_name="Weather Code")
    weather_description = models.CharField(max_length=100, verbose_name="Weather_Description")

    class Meta:
        managed = False
        db_table = config("PREDICT_WEATHER_DATA_TABLE_NAME", default="predict_weather")
        ordering = ["province", "time"]
        constraints = [
            models.UniqueConstraint(fields=['province', 'time'], name='unique_province_time')
        ]

    def __str__(self):
        return f'{self.province} - {self.time}: {self.weather_description}'

#save gmail and province of user to send information weather's information to user

class Subscriber(models.Model):
    email = models.EmailField(verbose_name="Email")
    province = models.CharField(max_length=100, verbose_name="Province")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    is_active = models.BooleanField(default=True, verbose_name="Is Active")

    class Meta:
        db_table = 'subscribers'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.email} - {self.province}'