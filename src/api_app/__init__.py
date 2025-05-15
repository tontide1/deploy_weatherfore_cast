import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from django.conf import settings
from django.db import connection
import requests
from datetime import datetime
import logging
from pytz import timezone

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAIL_USERNAME = 'weatherforecast.ad@gmail.com'
MAIL_PASSWORD = 'vtdxbfhajlvdmspe'

# Hàm gửi email
def send_weather_email(to_email, province, weather_info):
    # Lấy ngày đầu tiên từ dữ liệu thời tiết (nếu có)
    if weather_info:
        try:
            # Kiểm tra nếu weather_info là string thì parse thành JSON
            if isinstance(weather_info, str):
                import json
                weather_info = json.loads(weather_info)
            
            # Lấy thời gian từ item đầu tiên
            first_item = weather_info[0] if isinstance(weather_info, list) else weather_info
            dt = datetime.fromisoformat(first_item['time'].replace('Z', '+00:00'))
            date_str = dt.strftime('%d/%m/%Y')
        except Exception as e:
            print(f"Lỗi xử lý thời gian: {e}")
            date_str = 'hôm nay'
    else:
        date_str = 'hôm nay'
        
    subject = f"Dự báo thời tiết ngày {date_str} cho {province}"
    body = f"""
    <h3 style='color:#2563eb;'>Dự báo thời tiết cho <b>{province}</b> ngày <b>{date_str}</b>:</h3>
    <table border='1' cellpadding='8' cellspacing='0' style='border-collapse:collapse;font-size:15px;'>
        <thead style='background:#f1f5f9;'>
            <tr>
                <th>Thời gian</th>
                <th>Nhiệt độ</th>
                <th>Lượng mưa</th>
                <th>Gió</th>
            </tr>
        </thead>
        <tbody>
    """
    
    # Đảm bảo weather_info là list
    if not isinstance(weather_info, list):
        weather_info = [weather_info]
        
    for item in weather_info:
        # Định dạng lại thời gian cho đẹp
        try:
            dt = datetime.fromisoformat(item['time'].replace('Z', '+00:00'))
            time_str = dt.strftime('%H:%M %d/%m/%Y')
        except Exception as e:
            print(f"Lỗi xử lý thời gian item: {e}")
            time_str = item.get('time', 'N/A')
            
        body += f"""
            <tr>
                <td>{time_str}</td>
                <td>{item.get('temperature', 'N/A')}°C</td>
                <td>{item.get('precipitation', 'N/A')} mm</td>
                <td>{item.get('windspeed_max', 'N/A')} km/h</td>
            </tr>
        """
    body += """
        </tbody>
    </table>
    <p style='color:#64748b;font-size:13px;'>Cảm ơn bạn đã sử dụng dịch vụ dự báo thời tiết!</p>
    """
    msg = MIMEMultipart()
    msg['From'] = MAIL_USERNAME
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_USERNAME, to_email, msg.as_string())
        print(f"Đã gửi email tới {to_email}")
    except Exception as e:
        print(f"Lỗi gửi email tới {to_email}: {e}")

# Hàm lấy danh sách subscriber từ DB
def get_all_subscribers():
    from api_app.models import Subscriber
    return Subscriber.objects.filter(is_active=True)

# Hàm lấy dữ liệu thời tiết từ API
def get_weather_data(province):
    url = f"http://127.0.0.1:8000/api/get-weather-data/?province={province}"
    try:
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            # Kiểm tra và lấy weather_data từ response
            if isinstance(data, dict) and 'weather_data' in data:
                return data['weather_data']
            return data
        else:
            print(f"Không lấy được dữ liệu thời tiết cho {province}")
            return []
    except Exception as e:
        print(f"Lỗi gọi API thời tiết: {e}")
        return []

# Hàm gửi email cho tất cả subscriber
def send_daily_weather_emails():
    logger.info(f"[Scheduler] Bắt đầu gửi email lúc {datetime.now()}")
    try:
        for sub in get_all_subscribers():
            weather = get_weather_data(sub.province)
            if weather:
                send_weather_email(sub.email, sub.province, weather)
                logger.info(f"Đã gửi email thành công cho {sub.email}")
    except Exception as e:
        logger.error(f"Lỗi khi gửi email: {str(e)}")

# Hàm kiểm tra trạng thái scheduler
def check_scheduler_health():
    if not scheduler.running:
        logger.error("Scheduler không chạy, đang khởi động lại...")
        scheduler.start()

# Khởi tạo scheduler với timezone Việt Nam và persistent job store
vietnam_tz = timezone('Asia/Ho_Chi_Minh')
jobstores = {
    'default': SQLAlchemyJobStore(url='sqlite:///jobs.sqlite')
}

scheduler = BackgroundScheduler(
    jobstores=jobstores,
    timezone=vietnam_tz
)

# Thêm job gửi email hàng ngày
try:
    scheduler.add_job(
        send_daily_weather_emails,
        'cron',
        hour=18,
        minute=45,
        id='send_daily_weather_emails',
        replace_existing=True
    )
    logger.info("Đã thêm job gửi email hàng ngày vào lúc 17:40")
except Exception as e:
    logger.error(f"Lỗi khi thêm job gửi email: {str(e)}")

# Thêm job kiểm tra sức khỏe scheduler mỗi 5 phút
try:
    scheduler.add_job(
        check_scheduler_health,
        'interval',
        minutes=5,
        id='check_scheduler_health',
        replace_existing=True
    )
    logger.info("Đã thêm job kiểm tra sức khỏe scheduler")
except Exception as e:
    logger.error(f"Lỗi khi thêm job kiểm tra sức khỏe: {str(e)}")

# Khởi động scheduler
try:
    scheduler.start()
    logger.info('APScheduler đã được khởi động thành công!')
except Exception as e:
    logger.error(f'Lỗi khi khởi động APScheduler: {str(e)}')