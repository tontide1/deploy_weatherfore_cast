# import csv
import os
import requests
from datetime import date, timedelta, datetime


provinces = [
    {"name": "An Giang", "lat": 10.521, "lon": 105.125},
    {"name": "Bà Rịa - Vũng Tàu", "lat": 10.541, "lon": 107.242},
    {"name": "Bạc Liêu", "lat": 9.294, "lon": 105.724},
    {"name": "Bắc Giang", "lat": 21.273, "lon": 106.194},
    {"name": "Bắc Kạn", "lat": 22.147, "lon": 105.834},
    {"name": "Bắc Ninh", "lat": 21.186, "lon": 106.076},
    {"name": "Bến Tre", "lat": 10.243, "lon": 106.375},
    {"name": "Bình Dương", "lat": 11.325, "lon": 106.477},
    {"name": "Bình Định", "lat": 14.166, "lon": 108.902},
    {"name": "Bình Phước", "lat": 11.751, "lon": 106.723},
    {"name": "Bình Thuận", "lat": 11.090, "lon": 108.072},
    {"name": "Cà Mau", "lat": 9.176, "lon": 105.152},
    {"name": "Cao Bằng", "lat": 22.665, "lon": 106.257},
    {"name": "Cần Thơ", "lat": 10.045, "lon": 105.746},
    {"name": "Đà Nẵng", "lat": 16.047, "lon": 108.206},
    {"name": "Đắk Lắk", "lat": 12.710, "lon": 108.237},
    {"name": "Đắk Nông", "lat": 12.264, "lon": 107.609},
    {"name": "Điện Biên", "lat": 21.383, "lon": 103.016},
    {"name": "Đồng Nai", "lat": 10.948, "lon": 106.824},
    {"name": "Đồng Tháp", "lat": 10.535, "lon": 105.636},
    {"name": "Gia Lai", "lat": 13.807, "lon": 108.109},
    {"name": "Hà Giang", "lat": 22.750, "lon": 104.983},
    {"name": "Hà Nam", "lat": 20.583, "lon": 105.922},
    {"name": "Hà Nội", "lat": 21.028, "lon": 105.854},
    {"name": "Hà Tĩnh", "lat": 18.342, "lon": 105.905},
    {"name": "Hải Dương", "lat": 20.938, "lon": 106.330},
    {"name": "Hải Phòng", "lat": 20.844, "lon": 106.688},
    {"name": "Hậu Giang", "lat": 9.757, "lon": 105.641},
    {"name": "Hòa Bình", "lat": 20.817, "lon": 105.337},
    {"name": "Hưng Yên", "lat": 20.646, "lon": 106.051},
    {"name": "Khánh Hòa", "lat": 12.259, "lon": 109.196},
    {"name": "Kiên Giang", "lat": 10.012, "lon": 105.080},
    {"name": "Kon Tum", "lat": 14.349, "lon": 108.000},
    {"name": "Lai Châu", "lat": 22.396, "lon": 103.458},
    {"name": "Lâm Đồng", "lat": 11.575, "lon": 108.142},
    {"name": "Lạng Sơn", "lat": 21.853, "lon": 106.761},
    {"name": "Lào Cai", "lat": 22.485, "lon": 103.970},
    {"name": "Long An", "lat": 10.543, "lon": 106.411},
    {"name": "Nam Định", "lat": 20.438, "lon": 106.162},
    {"name": "Nghệ An", "lat": 19.234, "lon": 104.920},
    {"name": "Ninh Bình", "lat": 20.250, "lon": 105.974},
    {"name": "Ninh Thuận", "lat": 11.564, "lon": 108.988},
    {"name": "Phú Thọ", "lat": 21.345, "lon": 105.254},
    {"name": "Phú Yên", "lat": 13.088, "lon": 109.092},
    {"name": "Quảng Bình", "lat": 17.468, "lon": 106.622},
    {"name": "Quảng Nam", "lat": 15.539, "lon": 108.019},
    {"name": "Quảng Ngãi", "lat": 15.120, "lon": 108.800},
    {"name": "Quảng Ninh", "lat": 21.006, "lon": 107.292},
    {"name": "Quảng Trị", "lat": 16.744, "lon": 107.189},
    {"name": "Sóc Trăng", "lat": 9.602, "lon": 105.973},
    {"name": "Sơn La", "lat": 21.325, "lon": 103.918},
    {"name": "Tây Ninh", "lat": 11.365, "lon": 106.098},
    {"name": "Thái Bình", "lat": 20.446, "lon": 106.342},
    {"name": "Thái Nguyên", "lat": 21.594, "lon": 105.848},
    {"name": "Thanh Hóa", "lat": 19.807, "lon": 105.776},
    {"name": "Thừa Thiên Huế", "lat": 16.463, "lon": 107.590},
    {"name": "Tiền Giang", "lat": 10.449, "lon": 106.342},
    {"name": "TP Hồ Chí Minh", "lat": 10.776, "lon": 106.700},
    {"name": "Trà Vinh", "lat": 9.812, "lon": 106.299},
    {"name": "Tuyên Quang", "lat": 21.823, "lon": 105.218},
    {"name": "Vĩnh Long", "lat": 10.253, "lon": 105.973},
    {"name": "Vĩnh Phúc", "lat": 21.308, "lon": 105.604},
    {"name": "Yên Bái", "lat": 21.705, "lon": 104.870}
]

# Tạo thư mục weather_data nếu chưa tồn tại
# DATA_DIR = "./weather_data"
# os.makedirs(DATA_DIR, exist_ok=True)
# Ngày hôm nay (YYYY-MM-DD)
today = date.today()
number_of_days = 30
start_date = today - timedelta(days=number_of_days)
end_date = today

current_hour = datetime.now().hour
print(f"📅 Ngày bắt đầu: {start_date}")
print(f"📅 Ngày kết thúc: {end_date}")

# csv_file = os.path.join(DATA_DIR,"historical_weather_data.csv")
# header = ["Province", "Time", "Temperature", "Temp_Max", "Temp_Min", "Precipitation", "Windspeed_Max", "UV_Index_Max", "Sunshine_Hours", "Sundown_Hours", "Weather_Code", "Humidity", "Feel_Like"]

# Danh sách chứa tất cả dữ liệu thu thập được
all_rows = []

for province in provinces:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": province["lat"],
        "longitude": province["lon"],
        "hourly": "temperature_2m,precipitation,windspeed_10m,uv_index,weathercode,sunshine_duration,relativehumidity_2m,apparent_temperature",
        "timezone": "Asia/Bangkok",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }

    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json().get("hourly", {})
        times = data["time"]
        temps = data["temperature_2m"]
        precs = data["precipitation"]
        winds = data["windspeed_10m"]
        uvs = data["uv_index"]
        weathercodes = data["weathercode"]
        sunshines = data.get("sunshine_duration", [0]*len(times))
        humidity = data["relativehumidity_2m"]
        feel_like = data["apparent_temperature"]

        # Gom nhóm các chỉ số theo ngày
        day_indices = {}
        for idx, t in enumerate(times):
            day = t.split("T")[0]
            if day not in day_indices:
                day_indices[day] = []
            day_indices[day].append(idx)

        for i, t in enumerate(times):
            hour = int(t.split("T")[1][:2])
            day = t.split("T")[0]
            # Chỉ lấy giờ chia hết cho 3, không vượt quá current_hour
            if (hour % 3 != 0):
                continue

            indices = day_indices[day]
            temp_max = max([temps[j] for j in indices])
            temp_min = min([temps[j] for j in indices])
            wind_max = max([winds[j] for j in indices])
            uv_max = max([uvs[j] for j in indices])
            sunshine_hours = sum(
                [sunshines[j] for j in indices if 6 <= int(times[j].split("T")[1][:2]) < 18]
            ) / 3600
            sundown_hours = len([
                j for j in indices
                if int(times[j].split("T")[1][:2]) < 6 or int(times[j].split("T")[1][:2]) >= 18
            ])
            row = [
                province["name"],
                t,
                temps[i],
                temp_max,
                temp_min,
                precs[i],
                wind_max,
                uv_max,
                round(sunshine_hours, 2),
                sundown_hours,
                weathercodes[i],
                humidity[i],
                feel_like[i]
            ]
            all_rows.append(row)
        print(f"✅ {province['name']}: xong")
    else:
        print(f"❌ {province['name']}: lỗi API")


try:
    import psycopg2
    from dotenv import load_dotenv
    load_dotenv()
    DB_PARAMS = {
        'database': os.environ.get("DATABASE_NAME"),
        'user': os.environ.get("DATABASE_USER"),
        'password': os.environ.get("DATABASE_PASSWORD"),
        'host': os.environ.get("DATABASE_HOST"),
        'port': os.environ.get("DATABASE_PORT")
    }
    # print(DB_PARAMS)

    # Kết nối đến PostgreSQL
    connection = psycopg2.connect(**DB_PARAMS)
    cursor = connection.cursor()
    
    table_name = os.environ.get("WEATHER_DATA_TABLE_NAME", default="weather_data")
    # Xóa bảng nếu đã tồn tại
    # cursor.execute(f"""
    #     DROP TABLE IF EXISTS {table_name};
    # """)
    # connection.commit()
    # Tạo bảng mới
    cursor.execute(
        f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id SERIAL PRIMARY KEY,
                Province VARCHAR(100) NOT NULL,
                Time TIMESTAMP NOT NULL,
                Temperature DECIMAL(5,2),
                Temp_Max DECIMAL(5,2),
                Temp_Min DECIMAL(5,2),
                Precipitation DECIMAL(5,2),
                Windspeed_Max DECIMAL(5,2),
                UV_Index_Max DECIMAL(5,2),
                Sunshine_Hours DECIMAL(5,2),
                Sundown_Hours DECIMAL(5,2),
                Weather_Code INTEGER,
                Humidity DECIMAL(5,2),
                Feel_Like DECIMAL(5,2),

                CONSTRAINT unique_historical_province_time UNIQUE (Province, Time)
            );
        """
    )
    connection.commit()
    # print(f"Tạo bảng thành công")
    # Tạo bảng tạm để chứa dữ liệu
    temp_table_name = table_name+"_temp"
    cursor.execute(
        f"""
        CREATE TEMPORARY TABLE {temp_table_name} (
            id SERIAL PRIMARY KEY,
                Province VARCHAR(100) NOT NULL,
                Time TIMESTAMP NOT NULL,
                Temperature DECIMAL(5,2),
                Temp_Max DECIMAL(5,2),
                Temp_Min DECIMAL(5,2),
                Precipitation DECIMAL(5,2),
                Windspeed_Max DECIMAL(5,2),
                UV_Index_Max DECIMAL(5,2),
                Sunshine_Hours DECIMAL(5,2),
                Sundown_Hours DECIMAL(5,2),
                Weather_Code INTEGER,
                Humidity DECIMAL(5,2),
                Feel_Like DECIMAL(5,2)
        );
        """
    )
    connection.commit()
    # Chèn dữ liệu vào bảng tạm
    insert_query = f"""
        INSERT INTO {temp_table_name} (
            Province,Time,Temperature,Temp_Max,Temp_Min,Precipitation,Windspeed_Max,UV_Index_Max,Sunshine_Hours,Sundown_Hours,Weather_Code,Humidity,Feel_Like
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(insert_query, all_rows)
    connection.commit()
    # Ghi dữ liệu từ bảng tạm vào bảng chính
    cursor.execute(
        f"""
        INSERT INTO {table_name} (
            Province,Time,Temperature,Temp_Max,Temp_Min,Precipitation,Windspeed_Max,UV_Index_Max,Sunshine_Hours,Sundown_Hours,Weather_Code,Humidity,Feel_Like
        )
        SELECT
            Province,Time,Temperature,Temp_Max,Temp_Min,Precipitation,Windspeed_Max,UV_Index_Max,Sunshine_Hours,Sundown_Hours,Weather_Code,Humidity,Feel_Like
        FROM {temp_table_name}
        ON CONFLICT ON CONSTRAINT unique_historical_province_time
        DO UPDATE SET
            Temperature = EXCLUDED.Temperature,
            Temp_Max = EXCLUDED.Temp_Max,
            Temp_Min = EXCLUDED.Temp_Min,
            Precipitation = EXCLUDED.Precipitation,
            Windspeed_Max = EXCLUDED.Windspeed_Max,
            UV_Index_Max = EXCLUDED.UV_Index_Max,
            Sunshine_Hours = EXCLUDED.Sunshine_Hours,
            Sundown_Hours = EXCLUDED.Sundown_Hours,
            Weather_Code = EXCLUDED.Weather_Code,
            Humidity = EXCLUDED.Humidity,
            Feel_Like = EXCLUDED.Feel_Like;
        """
    )
    connection.commit()
    print(f"✅ Đã chèn {len(all_rows)} dòng vào PostgreSQL")
except Exception as e:
    print(f"❌ Lỗi khi ghi vào PostgreSQL: {e}")

finally:
    if connection:
        cursor.close()
        connection.close()