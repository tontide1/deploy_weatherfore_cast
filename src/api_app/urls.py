from django.urls import path

from . import views, views


app_name = 'api_app'
urlpatterns = [
    # API ENDPOINT
    path('get-data/', views.GetWeatherApiView, name='get-data'),
    path('get-unique-provinces/', views.GetUniqueProvinceApiView, name='get-unique-provinces'),
    path('get-weather-data/', views.GetWeatherProvinceApiView, name='get-weather-data'),
    path('get-predict-weather-data/', views.GetPredictWeatherApiView, name='get-predict-weather-data'),
    path('subscribe/', views.SubscribeApiView, name='subscribe'),
]