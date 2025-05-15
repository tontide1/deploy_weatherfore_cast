from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view

from .models import Weather, PredictWeather, Subscriber
from .serializers import WeatherSerializer, PredictWeatherSerializer



# API lấy dữ liệu thời tiết từ DB
@api_view(['GET'])
def GetWeatherApiView(request):
    if request.method == 'GET':
        weather = Weather.objects.all()
        serialize = WeatherSerializer(weather, many=True)
        # print('-'*100)
        # print(serialize.data)
        return Response(serialize.data, status=status.HTTP_200_OK)


# API lấy tên các tỉnh
@api_view(['GET'])
def GetUniqueProvinceApiView(request):
    if request.method == 'GET':
        try:
            unique_provinces = list(Weather.objects.values_list('province', flat=True).distinct("province"))
            return Response({"unique_provinces": list(unique_provinces)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# API lấy tỉnh theo tên tỉnh/thành phố
@api_view(['GET'])
def GetWeatherProvinceApiView(request):
    """
    API để lấy dữ liệu thời gần nhất tiết theo tỉnh 8 giờ gần nhât (mỗi giờ cách nhau 3 giờ)
    """
    if request.method == 'GET':
        province = request.GET.get('province', None)
        if not province:
            return Response({"error": "Missing 'province' parameter"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            weather_data = Weather.objects.filter(province=province).order_by('time')
            serialize = WeatherSerializer(weather_data, many=True)
            return Response(serialize.data[-8:], status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

# API lấy dữ liệu dự đoán từ DB
@api_view(['GET'])
def GetPredictWeatherApiView(request):
    if request.method == 'GET':
        province = request.GET.get('province', None)
        if not province:
            return Response({"error": "Missing 'province' parameter"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if "Hồ Chí Minh" in province:
                province = "TP Hồ Chí Minh"
            else:
                province = province.title()
            predict_weather = PredictWeather.objects.filter(province=province).order_by('time')
            if not predict_weather.exists():
                return Response({"error": f"No data found for province: {province}"}, status=status.HTTP_404_NOT_FOUND)
            serialize = PredictWeatherSerializer(predict_weather, many=True)
            return Response(serialize.data[-8:], status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

@api_view(['POST'])
def SubscribeApiView(request):
    if request.method == 'POST':
        try:
            email = request.data.get('email')
            province = request.data.get('province')
            
            if not email or not province:
                return Response(
                    {"error": "Email and province are required", "type": "error"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if subscriber already exists with the same email and province
            subscriber = Subscriber.objects.filter(email=email, province=province).first()
            
            if subscriber:
                # If subscriber exists with same email and province, just activate if inactive
                if not subscriber.is_active:
                    subscriber.is_active = True
                    subscriber.save()
                    return Response({
                        "message": "Kích hoạt lại đăng ký thành công!",
                        "type": "success"
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "message": "Bạn đã đăng ký tỉnh này rồi!",
                        "type": "error"
                    }, status=status.HTTP_200_OK)
            else:
                # Create new subscription
                subscriber = Subscriber.objects.create(
                    email=email,
                    province=province
                )
                return Response({
                    "message": "Đăng ký thành công! Bạn sẽ nhận email về thời tiết vào lúc 7h sáng mỗi ngày!",
                    "type": "success"
                }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e), "type": "error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )