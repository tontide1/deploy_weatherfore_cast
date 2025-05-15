FROM python:3.11-slim-bullseye

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

RUN apt-get update && \
    apt-get install -y postgresql-client dos2unix && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/weather_data

COPY . .

RUN dos2unix entrypoint.sh && \
    chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]

CMD ["gunicorn", "--chdir", "/app/src", "weather_forecast_management.wsgi:application", "--bind", "0.0.0.0:8000"]