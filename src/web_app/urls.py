from django.urls import path
from . import views

app_name = 'web_app'

urlpatterns = [
    path('', views.home_view, name='home'),
    
]
