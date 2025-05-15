// DOM elements
const tabs = document.querySelectorAll('.tab');
const charts = document.querySelectorAll('.chart');

// Variables for storing weather data
let currentWeatherData = null;
let hasSearched = false; // Track whether user has searched for a location
const defaultCity = "TP Hồ Chí Minh"; // Đặt TP Hồ Chí Minh làm thành phố mặc định
let currentViewedProvince = defaultCity; // Tỉnh đang xem hiện tại
let weatherUpdateInterval = null; // Biến lưu trữ interval để cập nhật dữ liệu

// Thêm hàm getCookie để lấy CSRF token từ cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Get unique province
async function getUniqueProvinces() {
  try {
    const response = await fetch('/api/get-unique-provinces/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.unique_provinces;
  } catch (error) {
    console.error('Lỗi khi gọi API:', error);
    return [];
  }
}

// Add click event listeners to tabs
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabType = tab.getAttribute('data-tab');

    // Remove active class from all tabs and charts
    tabs.forEach(t => t.classList.remove('active'));
    charts.forEach(c => c.classList.remove('active'));

    // Add active class to clicked tab and corresponding chart
    tab.classList.add('active');
    document.getElementById(`${tabType}Chart`).classList.add('active');

    // Redraw the appropriate chart when tab is clicked
    if (hasSearched && currentWeatherData) {
      if (tabType === 'temperature') {
        drawTemperatureLine(extractTemperatures(currentWeatherData));
      } else if (tabType === 'precipitation') {
        drawPrecipitationLine(extractPrecipitation(currentWeatherData));
      } else if (tabType === 'wind') {
        drawWindLine(extractWindspeeds(currentWeatherData));
      }
    } else {
      // Draw empty/default charts if no search has been performed
      if (tabType === 'temperature') {
        drawTemperatureLine();
      } else if (tabType === 'precipitation') {
        drawPrecipitationLine();
      } else if (tabType === 'wind') {
        drawWindLine();
      }
    }
  });
});

// Helper functions to extract data from API response
function extractTemperatures(data) {
  return data.map(item => Math.round(item.temperature));
}

function extractPrecipitation(data) {
  // console.log('Extracting precipitation data:', data);
  // Convert precipitation to percentage (0-100%)
  // We'll consider anything above 10mm as 100%
  return data.map(item => {
    const precipValue = item.precipitation;
    return precipValue;
  });
}

function extractWindspeeds(data) {
  return data.map(item => parseFloat(item.windspeed_max).toFixed(1));
}


// Extract time labels from data
function extractTimeLabels(data) {
  return data.map(item => {
    const date = new Date(item.time);
    return date.getHours().toString().padStart(2, '0') + ':00';
  });
}

// Function to draw temperature chart line
function drawTemperatureLine(values = [0, 0, 0, 0, 0, 0, 0, 0]) {
  const canvas = document.getElementById('tempCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const tempContainer = document.getElementById('temperatureChart');

  // Get container dimensions
  const width = tempContainer.clientWidth;
  const height = tempContainer.clientHeight;

  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;

  // Set background color
  ctx.fillStyle = '#202025';
  ctx.fillRect(0, 0, width, height);

  // Padding giống như trong CSS
  const padding = { left: 0, right: 0, top: 25, bottom: 10 };

  // Tính toán chiều rộng cho điểm
  const chartWidth = width;
  const pointSpacing = chartWidth / values.length;

  // Tạo mảng vị trí các điểm
  const positions = [];
  for (let i = 0; i < values.length; i++) {
    // Vị trí điểm cách đều nhau
    const x = pointSpacing * (i + 0.5);
    positions.push(x);
  }

  // Tính toán chiều cao biểu đồ
  const chartHeight = height - padding.top - padding.bottom;
  const baseY = padding.top + (chartHeight * 0.5);

  // Find min and max temperatures to scale the chart properly
  const minTemp = Math.min(...values);
  const maxTemp = Math.max(...values);
  const tempRange = Math.max(maxTemp - minTemp, 5); // Ensure at least 5 degrees range for visual clarity

  const yScale = chartHeight * 0.4;

  // Tạo mảng điểm
  const points = [];
  values.forEach((temp, i) => {
    const x = positions[i];

    // Tính toán vị trí Y dựa trên nhiệt độ
    const normalizedTemp = (temp - minTemp) / tempRange;
    const y = baseY - (normalizedTemp * yScale);

    points.push({ x, y, temp });
  });

  // Tô màu bên dưới đường
  ctx.beginPath();
  ctx.moveTo(points[0].x, height - padding.bottom);
  ctx.lineTo(points[0].x, points[0].y);

  // Nối tất cả các điểm
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  // Đóng đường path
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);

  // Tạo gradient màu cho phần tô
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(249, 171, 0, 0.25)');
  gradient.addColorStop(1, 'rgba(249, 171, 0, 0.05)');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Vẽ đường nhiệt độ
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.strokeStyle = '#f9ab00';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vẽ điểm trên đường nhiệt độ
  points.forEach(point => {
    // Vẽ điểm trắng với viền vàng
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#f9ab00';
    ctx.lineWidth = 1;
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Vẽ giá trị nhiệt độ
  ctx.textAlign = 'center';
  ctx.font = '11px Roboto';
  ctx.fillStyle = '#ffffff';

  points.forEach(point => {
    ctx.fillText(point.temp + '°C', point.x, point.y - 10);
  });
}

// Function to update Precipitation values in HTML
function updatePrecipitation(values) {
  const precipitationValue = document.querySelectorAll('.precipitation-value');

  precipitationValue.forEach((value, index) => {
    const precipValue = values[index]
    let targetElement = precipitationValue[index]
    const sheet = document.styleSheets[0]; // lấy stylesheet đầu tiên
    sheet.insertRule(`
      .adjust-before-${index}::before {
        height: ${precipValue}px !important;
      }
    `, sheet.cssRules.length);

    targetElement.classList.add(`adjust-before-${index}`);


    value.textContent = `${parseFloat(precipValue).toFixed(1)} mm`;
  });
}
// Function to draw precipitation chart line
function drawPrecipitationLine(values = [0, 0, 0, 0, 0, 0, 0, 0]) {
  updatePrecipitation(values);
  // console.log('Drawing precipitation line with values:', values);
  const canvas = document.getElementById('precipCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const precipContainer = document.getElementById('precipitationChart');

  // Get container dimensions
  const width = precipContainer.clientWidth;
  const height = precipContainer.clientHeight;

  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;

  // Set background color
  ctx.fillStyle = '#202025';
  ctx.fillRect(0, 0, width, height);

  // Padding giống như trong CSS
  const padding = { left: 0, right: 0, top: 25, bottom: 10 };

  // Tính toán chiều rộng cho điểm
  const chartWidth = width;
  const pointSpacing = chartWidth / values.length;

  // Tạo mảng vị trí các điểm
  const positions = [];
  for (let i = 0; i < values.length; i++) {
    // Vị trí điểm cách đều nhau
    const x = pointSpacing * (i + 0.5);
    positions.push(x);
  }

  // Tính toán chiều cao biểu đồ
  const chartHeight = height - padding.top - padding.bottom;
  const baseY = padding.top + (chartHeight * 0.5);
  const yScale = chartHeight * 0.4;

  // Tạo mảng điểm
  const points = [];
  values.forEach((value, i) => {
    const x = positions[i];

    // Tính toán vị trí Y dựa trên % lượng mưa (0-100%)
    const normalizedValue = value / 100;
    const y = baseY - (normalizedValue * yScale);

    points.push({ x, y, value });
  });

  // Tô màu bên dưới đường
  ctx.beginPath();
  ctx.moveTo(points[0].x, height - padding.bottom);
  ctx.lineTo(points[0].x, points[0].y);

  // Nối tất cả các điểm
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  // Đóng đường path
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);

  // Tạo gradient màu cho phần tô
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(66, 133, 244, 0.25)');
  gradient.addColorStop(1, 'rgba(66, 133, 244, 0.05)');
  // ctx.fillStyle = gradient;
  ctx.fill();

  // Vẽ đường lượng mưa
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.strokeStyle = '#4285f4';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vẽ điểm trên đường lượng mưa
  points.forEach(point => {
    // Vẽ điểm trắng với viền xanh
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#4285f4';
    ctx.lineWidth = 1;
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Vẽ giá trị lượng mưa
  ctx.textAlign = 'center';
  ctx.font = '11px Roboto';
  ctx.fillStyle = '#ffffff';

  points.forEach(point => {
    ctx.fillText(point.value + '%', point.x, point.y - 10);
  });

  // Update precipitation values in HTML
  const precipitationValues = document.querySelectorAll('.precipitation-value');
  if (precipitationValues.length === values.length) {
    precipitationValues.forEach((element, index) => {
      element.textContent = values[index] + '%';
    });
  }
}

// Function to draw wind chart line
function drawWindLine(values = [0, 0, 0, 0, 0, 0, 0, 0]) {
  updateWindSpeed(values);
  const canvas = document.getElementById('windCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const windContainer = document.getElementById('windChart');

  // Get container dimensions
  const width = windContainer.clientWidth;
  const height = windContainer.clientHeight;

  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;

  // Set background color
  ctx.fillStyle = '#202025';
  ctx.fillRect(0, 0, width, height);

  // Padding giống như trong CSS
  const padding = { left: 0, right: 0, top: 25, bottom: 10 };

  // Tính toán chiều rộng cho điểm
  const chartWidth = width;
  const pointSpacing = chartWidth / values.length;

  // Tạo mảng vị trí các điểm
  const positions = [];
  for (let i = 0; i < values.length; i++) {
    // Vị trí điểm cách đều nhau
    const x = pointSpacing * (i + 0.5);
    positions.push(x);
  }

  // Tính toán chiều cao biểu đồ
  const chartHeight = height - padding.top - padding.bottom;
  const baseY = padding.top + (chartHeight * 0.5);

  // Find max windspeed to scale properly
  const maxWind = Math.max(...values, 10); // At least 10 km/h for scaling
  const yScale = chartHeight * 0.4;

  // Tạo mảng điểm
  const points = [];
  values.forEach((value, i) => {
    const x = positions[i];

    // Tính toán vị trí Y dựa trên tốc độ gió
    const normalizedValue = value / maxWind;
    const y = baseY - (normalizedValue * yScale);

    points.push({ x, y, value });
  });

  // Tô màu bên dưới đường
  ctx.beginPath();
  ctx.moveTo(points[0].x, height - padding.bottom);
  ctx.lineTo(points[0].x, points[0].y);

  // Nối tất cả các điểm
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  // Đóng đường path
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);

  // Tạo gradient màu cho phần tô
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(112, 117, 122, 0.25)');
  gradient.addColorStop(1, 'rgba(112, 117, 122, 0.05)');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Vẽ đường tốc độ gió
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.strokeStyle = '#70757a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vẽ điểm trên đường tốc độ gió
  points.forEach(point => {
    // Vẽ điểm trắng với viền xám
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#70757a';
    ctx.lineWidth = 1;
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Vẽ giá trị tốc độ và hướng gió
  ctx.textAlign = 'center';
  ctx.font = '11px Roboto';
  ctx.fillStyle = '#ffffff';

  points.forEach(point => {
    ctx.fillText(point.value + ' km/h', point.x, point.y - 10);
  });

  // Update wind values in HTML
  const windValues = document.querySelectorAll('.wind-value');
  if (windValues.length === values.length) {
    windValues.forEach((element, index) => {
      const speedElement = element.querySelector('.wind-speed-value');
      if (speedElement) {
        speedElement.textContent = values[index];
      }
    });
  }
}

function updateWindSpeed(values) {
  const windspeedValue = document.querySelectorAll('.wind-speed-value');

  windspeedValue.forEach((value, index) => {
    value.textContent = values[index];
  });
}

// Update time markers based on weather data
function updateTimeMarkers(weatherData) {
  const timeMarkers = document.querySelectorAll('.time-marker');
  const times = extractTimeLabels(weatherData);

  if (timeMarkers.length === times.length) {
    timeMarkers.forEach((marker, index) => {
      marker.textContent = times[index];
    });
  }
}

function updateMainWeatherIcon(weatherCode, temperature) {
  // Lấy container của biểu tượng thời tiết
  const weatherIconContainer = document.querySelector('.weather-cloud-icon');
  if (!weatherIconContainer) return;

  // Lấy SVG của cloud
  const cloudSvg = weatherIconContainer.querySelector('.cloud-svg');
  if (!cloudSvg) return;

  // Lấy hiệu ứng mưa
  const rainAnimation = weatherIconContainer.querySelector('.rain-animation');

  // Xác định path SVG, màu sắc và hiệu ứng dựa trên mã thời tiết và nhiệt độ
  let svgPath = '';
  let iconColor = '';

  // Xóa tất cả hiệu ứng hiện tại
  if (rainAnimation) {
    rainAnimation.style.display = 'none';
  }

  // Xóa các hiệu ứng khác nếu tồn tại
  const snowAnimation = weatherIconContainer.querySelector('.snow-animation');
  if (snowAnimation) {
    snowAnimation.remove();
  }

  const sunAnimation = weatherIconContainer.querySelector('.sun-animation');
  if (sunAnimation) {
    sunAnimation.remove();
  }

  const thunderAnimation = weatherIconContainer.querySelector('.thunder-animation');
  if (thunderAnimation) {
    thunderAnimation.remove();
  }

  // Xác định icon và màu dựa trên mã thời tiết
  // WMO Weather interpretation codes
  if (weatherCode === 0 || weatherCode === 1) {
    // Trời nắng/quang đãng
    svgPath = 'M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z';

    // Màu dựa trên nhiệt độ
    if (temperature >= 30) {
      // Nắng nóng
      iconColor = '#ff9d00'; // Màu cam đậm
    } else if (temperature >= 25) {
      // Nắng ấm
      iconColor = '#ffb700'; // Màu vàng cam
    } else {
      // Nắng mát
      iconColor = '#ffd000'; // Màu vàng
    }

    // Thêm hiệu ứng ánh nắng
    const sunRaysDiv = document.createElement('div');
    sunRaysDiv.className = 'sun-animation';
    sunRaysDiv.innerHTML = `
      <span class="sunray"></span>
      <span class="sunray"></span>
      <span class="sunray"></span>
      <span class="sunray"></span>
    `;
    weatherIconContainer.appendChild(sunRaysDiv);

    // Thêm CSS cho hiệu ứng ánh nắng
    addSunAnimationStyles();
  }
  else if (weatherCode === 2 || weatherCode === 3) {
    // Mây/Trời nhiều mây
    svgPath = 'M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z';

    // Màu xám cho mây
    if (weatherCode === 2) {
      iconColor = '#d1d1d1'; // Mây vừa
    } else {
      iconColor = '#afafaf'; // Mây dày
    }
  }
  else if (weatherCode >= 45 && weatherCode <= 48) {
    // Sương mù
    svgPath = 'M3,15H13A1,1 0 0,1 14,16A1,1 0 0,1 13,17H3A1,1 0 0,1 2,16A1,1 0 0,1 3,15M16,15H21A1,1 0 0,1 22,16A1,1 0 0,1 21,17H16A1,1 0 0,1 15,16A1,1 0 0,1 16,15M1,12A5,5 0 0,1 6,7C7,4.65 9.3,3 12,3C15.43,3 18.24,5.66 18.5,9.03L19,9C21.19,9 22.97,10.76 23,13H21A2,2 0 0,0 19,11H17V10A5,5 0 0,0 12,5C9.5,5 7.45,6.82 7.06,9.19C6.73,9.07 6.37,9 6,9A3,3 0 0,0 3,12C3,12.35 3.06,12.69 3.17,13H1.1L1,12M3,19H5A1,1 0 0,1 6,20A1,1 0 0,1 5,21H3A1,1 0 0,1 2,20A1,1 0 0,1 3,19M8,19H21A1,1 0 0,1 22,20A1,1 0 0,1 21,21H8A1,1 0 0,1 7,20A1,1 0 0,1 8,19Z';

    // Màu cho sương mù
    iconColor = '#c3c3c3';
  }
  else if ((weatherCode >= 51 && weatherCode <= 57) || (weatherCode >= 61 && weatherCode <= 65)) {
    // Mưa nhẹ/Mưa phùn đến mưa to
    svgPath = 'M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z';

    // Màu cho mây mưa - từ xám đến tối hơn tùy mức độ mưa
    if (weatherCode <= 57) {
      // Mưa nhẹ
      iconColor = '#9eb0c3';
    } else if (weatherCode <= 63) {
      // Mưa vừa
      iconColor = '#808fa0';
    } else {
      // Mưa to
      iconColor = '#697784';
    }

    // Hiển thị hiệu ứng mưa
    if (rainAnimation) {
      rainAnimation.style.display = 'block';

      // Điều chỉnh tốc độ mưa theo cường độ
      const raindrops = rainAnimation.querySelectorAll('.raindrop');
      let duration = '1s';

      if (weatherCode >= 63) {
        duration = '0.7s'; // Mưa nhanh hơn
      } else if (weatherCode >= 51 && weatherCode <= 57) {
        duration = '1.5s'; // Mưa chậm hơn
      }

      raindrops.forEach(drop => {
        drop.style.animationDuration = duration;
      });

      // Thêm thêm hạt mưa nếu mưa to
      if (weatherCode >= 65 && raindrops.length < 5) {
        for (let i = 0; i < 2; i++) {
          const newDrop = document.createElement('span');
          newDrop.className = 'raindrop';
          newDrop.style.animationDuration = duration;
          rainAnimation.appendChild(newDrop);
        }
      }
    }
  }
  else if (weatherCode >= 71 && weatherCode <= 77) {
    // Tuyết
    svgPath = 'M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z';

    // Màu nhạt cho mây tuyết
    iconColor = '#b7c3cf';

    // Thêm hiệu ứng tuyết rơi
    const snowAnimationDiv = document.createElement('div');
    snowAnimationDiv.className = 'snow-animation';

    // Tạo các bông tuyết
    const snowflakeCount = weatherCode >= 75 ? 6 : 4;
    for (let i = 0; i < snowflakeCount; i++) {
      const snowflake = document.createElement('span');
      snowflake.className = 'snowflake';
      snowflake.innerHTML = '❄';
      snowflake.style.left = `${Math.random() * 80 + 10}%`;
      snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`;
      snowflake.style.animationDelay = `${Math.random() * 2}s`;
      snowAnimationDiv.appendChild(snowflake);
    }

    weatherIconContainer.appendChild(snowAnimationDiv);

    // Thêm CSS cho hiệu ứng tuyết rơi
    addSnowAnimationStyles();
  }
  else if (weatherCode >= 95 && weatherCode <= 99) {
    // Giông bão
    svgPath = 'M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z';

    // Màu tối cho mây giông bão
    iconColor = '#515a61';

    // Hiển thị hiệu ứng mưa
    if (rainAnimation) {
      rainAnimation.style.display = 'block';

      // Mưa nhanh hơn
      const raindrops = rainAnimation.querySelectorAll('.raindrop');
      raindrops.forEach(drop => {
        drop.style.animationDuration = '0.6s';
      });
    }

    // Thêm hiệu ứng sấm sét
    const thunderAnimationDiv = document.createElement('div');
    thunderAnimationDiv.className = 'thunder-animation';

    const thunderBolt = document.createElement('div');
    thunderBolt.className = 'thunder-bolt';
    thunderAnimationDiv.appendChild(thunderBolt);

    weatherIconContainer.appendChild(thunderAnimationDiv);

    // Thêm CSS cho hiệu ứng sấm sét
    addThunderAnimationStyles();
  }
  else {
    // Mây (mặc định)
    svgPath = 'M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z';

    // Màu mặc định
    iconColor = '#c3c3c3';
  }

  // Cập nhật SVG với đường dẫn và màu mới
  const cloudPath = cloudSvg.querySelector('path');
  if (cloudPath) {
    cloudPath.setAttribute('d', svgPath);
    cloudPath.setAttribute('fill', iconColor);
  }
}

// Hàm thêm CSS cho hiệu ứng tuyết
function addSnowAnimationStyles() {
  if (document.getElementById('snow-animation-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'snow-animation-styles';
  styleEl.textContent = `
    .snow-animation {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
    }
    
    .snowflake {
      position: absolute;
      top: -10px;
      color: white;
      font-size: 14px;
      opacity: 0.8;
      animation: snowfall linear infinite;
    }
    
    @keyframes snowfall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 0.8;
      }
      100% {
        transform: translateY(160px) rotate(360deg);
        opacity: 0.2;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

// Hàm thêm CSS cho hiệu ứng nắng
function addSunAnimationStyles() {
  if (document.getElementById('sun-animation-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'sun-animation-styles';
  styleEl.textContent = `
    .sun-animation {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
    }
    
    .sunray {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 70%;
      height: 3px;
      background: rgba(255, 208, 0, 0.5);
      transform-origin: 0 0;
      animation: sunray 4s linear infinite;
    }
    
    .sunray:nth-child(1) {
      transform: rotate(0deg);
      animation-delay: -1s;
    }
    
    .sunray:nth-child(2) {
      transform: rotate(90deg);
      animation-delay: -2s;
    }
    
    .sunray:nth-child(3) {
      transform: rotate(45deg);
      animation-delay: -0.5s;
    }
    
    .sunray:nth-child(4) {
      transform: rotate(135deg);
      animation-delay: -1.5s;
    }
    
    @keyframes sunray {
      0% {
        opacity: 0;
      }
      25% {
        opacity: 0.5;
      }
      50% {
        opacity: 0.8;
      }
      75% {
        opacity: 0.5;
      }
      100% {
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

// Hàm thêm CSS cho hiệu ứng sấm sét
function addThunderAnimationStyles() {
  if (document.getElementById('thunder-animation-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'thunder-animation-styles';
  styleEl.textContent = `
    .thunder-animation {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
    }
    
    .thunder-bolt {
      position: absolute;
      width: 10px;
      height: 50px;
      background: #ffeb3b;
      top: 50%;
      left: 50%;
      transform: translate(-50%, 0) rotate(10deg);
      clip-path: polygon(0 0, 100% 0, 90% 50%, 100% 50%, 50% 100%, 60% 50%, 0 50%);
      animation: lightning 3s infinite;
      opacity: 0;
    }
    
    @keyframes lightning {
      0% {
        opacity: 0;
      }
      2% {
        opacity: 0.8;
      }
      3% {
        opacity: 0.3;
      }
      4% {
        opacity: 0.9;
      }
      6% {
        opacity: 0;
      }
      50% {
        opacity: 0;
      }
      52% {
        opacity: 0.8;
      }
      54% {
        opacity: 0;
      }
      100% {
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

// Thêm CSS để cải thiện hiệu ứng mưa hiện có
function enhanceRainAnimation() {
  if (document.getElementById('enhanced-rain-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'enhanced-rain-styles';
  styleEl.textContent = `
    .rain-animation {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
    }
    
    .raindrop {
      position: absolute;
      background: linear-gradient(transparent, rgba(125, 211, 252, 0.8));
      height: 15px;
      width: 2px;
      border-radius: 0 0 5px 5px;
      transform: translateY(-10px);
      animation: rainfall 1s linear infinite;
    }
    
    .raindrop:nth-child(1) {
      left: 30%;
      animation-delay: -0.2s;
    }
    
    .raindrop:nth-child(2) {
      left: 50%;
      animation-delay: -0.6s;
    }
    
    .raindrop:nth-child(3) {
      left: 70%;
      animation-delay: -0.4s;
    }
    
    .raindrop:nth-child(4) {
      left: 40%;
      animation-delay: -0.1s;
    }
    
    .raindrop:nth-child(5) {
      left: 60%;
      animation-delay: -0.7s;
    }
    
    @keyframes rainfall {
      0% {
        transform: translateY(-10px);
        opacity: 0.8;
      }
      100% {
        transform: translateY(40px);
        opacity: 0.2;
      }
    }
  `;
  document.head.appendChild(styleEl);
}


// Variables for search functionality
let provinces = [];
let searchTimeout;
const searchInput = document.getElementById('searchInput');
const dropdownContainer = document.getElementById('dropdownContainer');

// Initialize the search functionality
async function initializeSearch() {
  // Fetch provinces when the page loads
  provinces = await getUniqueProvinces();
  // console.log('Loaded provinces:', provinces);

  // Add event listener to search input
  searchInput.addEventListener('input', handleSearchInput);

  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (!searchInput.contains(event.target) && !dropdownContainer.contains(event.target)) {
      dropdownContainer.style.display = 'none';
    }
  });

  // Show dropdown when clicking on the search input
  searchInput.addEventListener('click', () => {
    if (searchInput.value.length > 0) {
      filterProvinces(searchInput.value);
    } else {
      showAllProvinces();
    }
  });

  // Set the default city name in the search input
  if (searchInput) {
    searchInput.value = defaultCity;
  }

  // Automatically fetch data for default city
  fetchWeatherData(defaultCity);
  searchInput.value = "";
}

// Handle input in the search box
function handleSearchInput() {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Set a timeout to prevent excessive filtering on every keystroke
  searchTimeout = setTimeout(() => {
    const searchTerm = searchInput.value.trim();

    if (searchTerm.length > 0) {
      filterProvinces(searchTerm);
    } else {
      dropdownContainer.style.display = 'none';
    }
  }, 300);
}

// Filter provinces based on search term
function filterProvinces(searchTerm) {
  const filteredProvinces = provinces.filter(province =>
    province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredProvinces.length > 0) {
    renderDropdown(filteredProvinces);
  } else {
    dropdownContainer.style.display = 'none';
  }
}

// Show all provinces in the dropdown
function showAllProvinces() {
  if (provinces.length > 0) {
    renderDropdown(provinces);
  }
}

// Render the dropdown with provided provinces
function renderDropdown(provinceList) {
  // Clear previous results
  dropdownContainer.innerHTML = '';

  // Create dropdown items for each province
  provinceList.forEach(province => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.textContent = province;

    // Add click event to select a province
    item.addEventListener('click', () => {
      searchInput.value = province;
      dropdownContainer.style.display = 'none';

      // Fetch weather data for the selected province
      fetchWeatherData(province);
      searchInput.value = "";
    });

    dropdownContainer.appendChild(item);
  });

  // Show the dropdown
  dropdownContainer.style.display = 'block';
}

// Show welcome template when no province is selected
function showWelcomeTemplate() {
  // Hide weather details initially
  const weatherContainer = document.querySelector('.weather-container');

  // Add a welcome message to the weather container
  const welcomeTemplate = document.createElement('div');
  welcomeTemplate.className = 'welcome-template';
  welcomeTemplate.innerHTML = `
    <div class="welcome-content">
      <div class="welcome-icon">
        <svg viewBox="0 0 24 24" class="welcome-cloud-svg">
          <path d="M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z" fill="#7dd3fc"/>
        </svg>
      </div>
      <h2>Chào mừng đến với Weather Forecast!</h2>
      <p>Tìm kiếm một tỉnh thành để xem dự báo thời tiết chi tiết.</p>
    </div>
  `;

  // Check if welcome template already exists
  const existingWelcome = document.querySelector('.welcome-template');
  if (!existingWelcome) {
    const weatherHeader = document.querySelector('.weather-header');
    if (weatherHeader) {
      weatherHeader.appendChild(welcomeTemplate);
    }
  }

  // Hide detailed content initially
  const weatherDetails = document.querySelector('.current-weather-main');
  if (weatherDetails) {
    weatherDetails.style.display = 'none';
  }

  // Set initial empty state
  hasSearched = false;
}

// Hide welcome template and show weather details
function hideWelcomeTemplate() {
  // Remove welcome template
  const welcomeTemplate = document.querySelector('.welcome-template');
  if (welcomeTemplate) {
    welcomeTemplate.remove();
  }

  // Show weather details
  const weatherDetails = document.querySelector('.current-weather-main');
  if (weatherDetails) {
    weatherDetails.style.display = 'flex';
  }

  // Update state
  hasSearched = true;
}

// Show error message
function showErrorMessage(message) {
  // You could display an error message in the UI here
  const welcomeTemplate = document.querySelector('.welcome-template');
  if (welcomeTemplate) {
    welcomeTemplate.innerHTML = `
      <div class="welcome-content error">
        <div class="welcome-icon">
          <svg viewBox="0 0 24 24" class="error-icon">
            <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" fill="#ff6b6b"/>
          </svg>
        </div>
        <h2>Lỗi</h2>
        <p>${message}</p>
        <p>Vui lòng thử lại hoặc chọn tỉnh thành khác.</p>
      </div>
    `;
  }
}

// Get weather condition text based on weather code
function getWeatherCondition(weatherCode) {
  const weatherConditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Drizzle: Light intensity",
    53: "Drizzle: Moderate intensity",
    55: "Drizzle: Dense intensity",
    56: "Freezing drizzle: Light",
    57: "Freezing drizzle: Dense",
    61: "Rain: Slight",
    63: "Rain: Moderate",
    65: "Rain: Heavy",
    66: "Freezing rain: Light",
    67: "Freezing rain: Heavy",
    71: "Snow fall: Slight",
    73: "Snow fall: Moderate",
    75: "Snow fall: Heavy",
    77: "Snow grains",
    80: "Rain showers: Slight",
    81: "Rain showers: Moderate",
    82: "Rain showers: Violent",
    85: "Snow showers: Slight",
    86: "Snow showers: Heavy",
    95: "Thunderstorm: Slight or moderate",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };

  return weatherConditions[weatherCode] || 'Unknown';
}

function updateClock(element) {
  if (!element) return;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Thêm định dạng ngày
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  // Chỉ hiển thị thời gian (HH:mm:ss)
  element.textContent = `${hours}:${minutes}:${seconds}`;

  // Cập nhật thẻ current-date nếu tồn tại
  const currentDateElement = document.getElementById('current-date');
  if (currentDateElement) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = dayNames[now.getDay()];
    const monthName = monthNames[now.getMonth()];
    currentDateElement.textContent = `${dayName}, ${day} ${monthName} ${year}`;
  }
}

// Update the UI with the weather data
function updateWeatherUI(weatherData, forecastWeatherData) {
  // console.log('Updating weather UI with data:', forecastWeatherData);
  if (!weatherData || !weatherData.length) return;

  // Get current weather (last item in the array)
  const currentWeather = weatherData.at(-1);

  // Update weather icon 
  updateMainWeatherIcon(currentWeather.weather_code, currentWeather.temperature);

  // Update location
  const locationElement = document.querySelector('.location-weather span');
  if (locationElement) {
    locationElement.textContent = currentWeather.province;
  }

  // Update temperature
  const temperatureElement = document.querySelector('.temperature');
  if (temperatureElement) {
    // console.log(weatherData);
    for (let i=weatherData.length-1; i>=0 ; i--) {
      if (new Date(weatherData[i].time).getHours()<=new Date().getHours()) {
        temperatureElement.textContent = `${parseFloat(weatherData[i].temperature).toFixed(1)}°C`;
        break;
      }
    }
  }

  // Update feels like (using a simple formula since API doesn't provide it)
  const feelsLikeElement = document.querySelector('.feels-like');
  if (feelsLikeElement) {
    // Simple approximation - in a real app, you'd have the actual feels-like temperature
    const feelsLike = parseFloat(currentWeather.feel_like).toFixed(1);
    feelsLikeElement.textContent = `Feels like ${feelsLike}°C`;
  }

  // Update weather condition
  const weatherConditionElement = document.querySelector('.weather-condition span');
  if (weatherConditionElement) {
    weatherConditionElement.textContent = getWeatherCondition(currentWeather.weather_code);
  }

  // Update day and time
  const dayTimeElement = document.querySelector('.day-time span');
  updateClock(dayTimeElement);
  setInterval(() => updateClock(dayTimeElement), 1000);

  // Update precipitation
  const precipitationElement = document.querySelector('.weather-detail-item:nth-child(1) .detail-text span');
  if (precipitationElement) {
    // Convert precipitation to percentage
    const precipPercentage = currentWeather.precipitation
    precipitationElement.textContent = `${parseFloat(precipPercentage).toFixed(1)} mm`;
  }

  // Update humidity (this is estimated since API doesn't provide it)
  const humidityElement = document.querySelector('.weather-detail-item:nth-child(2) .detail-text span');
  if (humidityElement) {
    humidityElement.textContent = `${parseFloat(currentWeather.feel_like).toFixed(1)}%`;
  }

  // Update wind
  const windElement = document.querySelector('.weather-detail-item:nth-child(3) .detail-text span');
  if (windElement) {
    windElement.textContent = `${parseFloat(currentWeather.windspeed_max).toFixed(1)} km/h`;
  }

  // Update time markers
  updateTimeMarkers(weatherData);

  // Update charts
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) {
    const tabType = activeTab.getAttribute('data-tab');

    if (tabType === 'temperature') {
      drawTemperatureLine(extractTemperatures(weatherData));
    } else if (tabType === 'precipitation') {
      drawPrecipitationLine(extractPrecipitation(weatherData));
    } else if (tabType === 'wind') {
      drawWindLine(extractWindspeeds(weatherData));
    }
  }

  // Update weather today
  // forecast-item today
  const todayWeather = document.querySelector('.forecast-item.today');
  if (todayWeather) {
    const currentDay = todayWeather.querySelector('.day-name');
    currentDay.textContent = getCurrentDay(weatherData[0].time);
    const todayHigh = todayWeather.querySelector('.high');
    todayHigh.textContent = `${(parseFloat(currentWeather.temp_max)).toFixed(1)}°C`;
    const todayLow = todayWeather.querySelector('.low');
    todayLow.textContent = `${(parseFloat(currentWeather.temp_min)).toFixed(1)}°C`;
  }
  // Update forecast days if available (this would need proper forecast data)
  if ((new Date(currentWeather.time)).getDate()===(new Date(forecastWeatherData[0].time)).getDate()){
    forecastWeatherData = forecastWeatherData.slice(1,)
  }
  updateForecastDays(forecastWeatherData);
}

function getCurrentDay(time){
  // Assuming you have a date string like "2025-05-17" or in ISO format
    const dateObject = new Date(time);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[dateObject.getDay()];
    return dayName;
}

// Update forecast days based on weather data
function updateForecastDays(forecastWeatherData) {

  const forecastContainer = document.querySelector('.forecast-days');
  if (!forecastContainer) return;

  // Get the template from the first day
  const template = forecastContainer.querySelector('.forecast-item');
  if (!template) return;

  // For demonstration, we'll just update the temperatures
  const forecastItems = document.querySelectorAll('.forecast-item');
  forecastItems.forEach((item, index) => {
    // Update high temperature (with a random variation for demo)
    if (index != 0) {
      const dayName = item.querySelector('.day-name');
      if (dayName) {
        dayName.textContent = getCurrentDay(forecastWeatherData[index - 1]['time']);
      }
      
      const highTemp = item.querySelector('.high');
      if (highTemp) {
        highTemp.textContent = `${(parseFloat(forecastWeatherData[index - 1]['temp_max'])).toFixed(1)}°C`;
      }

      // Update low temperature
      const lowTemp = item.querySelector('.low');
      if (lowTemp) {
        lowTemp.textContent = `${(parseFloat(forecastWeatherData[index - 1]['temp_min'])).toFixed(1)}°C`;
      }
    }
  });
}

// Handle temperature unit toggle when clicking on degrees
const degreeElement = document.querySelector('.degree');
if (degreeElement) {
  degreeElement.addEventListener('click', () => {
    const currentUnit = degreeElement.textContent;
    const tempElements = document.querySelectorAll('.temperature, .temp-number');

    if (currentUnit === '°F') {
      // Convert to Celsius
      degreeElement.textContent = '°C';
      tempElements.forEach(el => {
        const fahrenheit = parseInt(el.textContent);
        const celsius = Math.round((fahrenheit - 32) * 5 / 9);
        el.textContent = celsius;
      });
    } else {
      // Convert to Fahrenheit
      degreeElement.textContent = '°F';
      tempElements.forEach(el => {
        const celsius = parseInt(el.textContent);
        const fahrenheit = Math.round(celsius * 9 / 5 + 32);
        el.textContent = fahrenheit;
      });
    }

    // Redraw temperature line after conversion if we have weather data
    if (hasSearched && currentWeatherData) {
      drawTemperatureLine(extractTemperatures(currentWeatherData));
    }
  });
}

// Add CSS for welcome template
function addWelcomeStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .welcome-template {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
      padding: 30px;
      text-align: center;
    }
    
    .welcome-content {
      max-width: 500px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .welcome-icon {
      margin-bottom: 20px;
    }
    
    .welcome-cloud-svg {
      width: 80px;
      height: 80px;
      filter: drop-shadow(0 0 10px rgba(125, 211, 252, 0.5));
    }
    
    .welcome-template h2 {
      color: #ffffff;
      margin-bottom: 15px;
      font-size: 24px;
    }
    
    .welcome-template p {
      color: #a0aec0;
      font-size: 16px;
      margin-bottom: 10px;
    }
    
    .welcome-template.error .welcome-content {
      color: #ff6b6b;
    }
    
    .error-icon {
      width: 80px;
      height: 80px;
      filter: drop-shadow(0 0 10px rgba(255, 107, 107, 0.5));
    }
  `;
  document.head.appendChild(styleEl);
}

// Handle email subscription form
function initializeSubscriptionForm() {
  const subscriptionForm = document.getElementById('weatherSubscription');

  if (subscriptionForm) {
    subscriptionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('subscriptionEmail');
      const email = emailInput.value.trim();
      const subscriptionButton = document.querySelector('.subscription-button');

      if (!email) {
        showSubscriptionMessage('Vui lòng nhập địa chỉ email của bạn', 'error');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showSubscriptionMessage('Địa chỉ email không hợp lệ', 'error');
        return;
      }

      // Change button state to loading
      const originalButtonText = subscriptionButton.textContent;
      subscriptionButton.textContent = 'Đang xử lý...';
      subscriptionButton.disabled = true;

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success message
        showSubscriptionMessage('Đăng ký thành công! Bạn sẽ nhận được dự báo thời tiết hàng ngày vào lúc 7h sáng.', 'success');
        emailInput.value = '';
      } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        showSubscriptionMessage('Có lỗi xảy ra. Vui lòng thử lại sau.', 'error');
      } finally {
        // Reset button state
        subscriptionButton.textContent = originalButtonText;
        subscriptionButton.disabled = false;
      }
    });
  }
}

// Show subscription message
function showSubscriptionMessage(message, type) {
  // Remove any existing message
  const existingMessage = document.querySelector('.subscription-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `subscription-message ${type}`;
  messageElement.textContent = message;

  // Add message after the form
  const subscriptionForm = document.getElementById('weatherSubscription');
  if (subscriptionForm) {
    subscriptionForm.after(messageElement);

    // Auto remove message after 5 seconds
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      setTimeout(() => messageElement.remove(), 500);
    }, 5000);
  }
}

// Add CSS for subscription messages
function addSubscriptionMessageStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
        .subscription-message {
            margin-top: 15px;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 14px;
            animation: fadeIn 0.3s ease;
            width: 100%;
            display: flex;
            align-items: center;
        }
        
        .subscription-message.success {
            background-color: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.4);
            color: #22c55e;
        }
        
        .subscription-message.error {
            background-color: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #ef4444;
        }
        
        .subscription-message.fade-out {
            opacity: 0;
            transition: opacity 0.5s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
  document.head.appendChild(styleEl);
}

// Initialize the subscription form for home_1.html
function initializeEmailSubscription() {
  const emailForm = document.querySelector('.email-subscription .subscription-form');
  const emailInput = document.getElementById('emailInput');
  const provinceInput = document.getElementById('provinceInput');
  const subscribeButton = document.getElementById('subscribeButton');

  if (emailForm && emailInput && provinceInput && subscribeButton) {
    // Chỉ giữ 1 event listener submit cho form
    emailForm.addEventListener('submit', handleEmailSubscription);

    // Add keypress event to allow submission with Enter key
    emailInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEmailSubscription();
      }
    });

    provinceInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        emailInput.focus();
      }
    });

    // Add focus animation effect
    // Phần tiếp theo của hàm initializeEmailSubscription()

    // Add focus animation effect
    emailInput.addEventListener('focus', function () {
      const container = document.querySelector('.subscription-container');
      if (container) {
        container.style.borderColor = 'rgba(125, 211, 252, 0.4)';
      }
    });

    provinceInput.addEventListener('focus', function () {
      const container = document.querySelector('.subscription-container');
      if (container) {
        container.style.borderColor = 'rgba(125, 211, 252, 0.4)';
      }
    });

    emailInput.addEventListener('blur', function () {
      const container = document.querySelector('.subscription-container');
      if (container) {
        container.style.borderColor = '';
      }
    });

    provinceInput.addEventListener('blur', function () {
      const container = document.querySelector('.subscription-container');
      if (container) {
        container.style.borderColor = '';
      }
    });

    // Add typing animation to glow effect
    emailInput.addEventListener('input', function () {
      const icon = document.querySelector('.input-wrapper .input-icon svg');
      if (icon) {
        icon.style.filter = 'drop-shadow(0 0 20px rgba(125, 211, 252, 0.8))';
        setTimeout(() => {
          icon.style.filter = '';
        }, 500);
      }
    });

    provinceInput.addEventListener('input', function () {
      const icon = document.querySelector('.location-input-icon svg');
      if (icon) {
        icon.style.filter = 'drop-shadow(0 0 20px rgba(125, 211, 252, 0.8))';
        setTimeout(() => {
          icon.style.filter = '';
        }, 500);
      }
    });

    // Initialize unique provinces for dropdown suggestions
    initializeProvinceAutocomplete();
  }

  // Initialize province autocomplete
  async function initializeProvinceAutocomplete() {
    try {
      const provinces = await getUniqueProvinces();
      if (provinces && provinces.length > 0) {
        // Create a datalist element for autocomplete
        const datalist = document.createElement('datalist');
        datalist.id = 'provinceList';

        // Add options from the provinces array
        provinces.forEach(province => {
          const option = document.createElement('option');
          option.value = province;
          datalist.appendChild(option);
        });

        // Append the datalist to the document
        document.body.appendChild(datalist);

        // Connect the datalist to the province input
        provinceInput.setAttribute('list', 'provinceList');
      }
    } catch (error) {
      console.error('Error initializing province autocomplete:', error);
    }
  }

  // Handle subscription logic
  async function handleEmailSubscription(e) {
    e.preventDefault();

    const emailInput = document.getElementById('emailInput');
    const provinceInput = document.getElementById('provinceInput');
    const subscribeButton = document.getElementById('subscribeButton');

    const email = emailInput.value.trim();
    const province = provinceInput.value.trim();

    // Validate province
    if (!province) {
      showEmailSubscriptionMessage('Vui lòng nhập tỉnh/thành phố của bạn', 'error');
      provinceInput.focus();
      shakeElement(provinceInput);
      return;
    }

    // Validate email
    if (!email) {
      showEmailSubscriptionMessage('Vui lòng nhập địa chỉ email của bạn', 'error');
      emailInput.focus();
      shakeElement(emailInput);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showEmailSubscriptionMessage('Địa chỉ email không hợp lệ. Vui lòng nhập đúng định dạng example@gmail.com', 'error');
      emailInput.focus();
      shakeElement(emailInput);
      return;
    }

    // Show loading state
    const originalText = subscribeButton.textContent;
    subscribeButton.innerHTML = '<span>Đang xử lý...</span>';
    subscribeButton.style.opacity = '0.8';
    subscribeButton.disabled = true;
    emailInput.disabled = true;
    provinceInput.disabled = true;

    try {
      // Add visual effect during processing
      const container = document.querySelector('.subscription-container');
      if (container) {
        container.style.borderColor = 'rgba(125, 211, 252, 0.5)';
      }

      const response = await fetch('/api/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ email, province })
      });

      const data = await response.json();

      if (response.ok) {
        // Show message with appropriate type
        showEmailSubscriptionMessage(data.message, data.type);

        // Only clear form and show success animation if it's a success message
        if (data.type === 'success') {
          // Add success animation
          const icon = document.querySelector('.email-icon');
          if (icon) {
            icon.style.transform = 'scale(1.1)';
            icon.style.filter = 'drop-shadow(0 0 25px rgba(125, 211, 252, 0.9))';
            setTimeout(() => {
              icon.style.transform = '';
              icon.style.filter = '';
            }, 1500);
          }

          // Clear input with animation
          emailInput.style.transition = 'background-color 0.5s ease';
          emailInput.style.backgroundColor = 'rgba(125, 211, 252, 0.15)';
          provinceInput.style.transition = 'background-color 0.5s ease';
          provinceInput.style.backgroundColor = 'rgba(125, 211, 252, 0.15)';
          setTimeout(() => {
            emailInput.value = '';
            provinceInput.value = '';
            emailInput.style.backgroundColor = '';
            provinceInput.style.backgroundColor = '';
          }, 300);

          // Add a visual feedback effect - briefly highlight the form
          if (container) {
            container.style.boxShadow = '0 0 30px rgba(56, 189, 248, 0.6)';
            setTimeout(() => {
              container.style.boxShadow = '';
              container.style.borderColor = '';
            }, 2000);
          }
        }
      } else {
        showEmailSubscriptionMessage(data.error || 'Có lỗi xảy ra.', 'error');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showEmailSubscriptionMessage('Có lỗi xảy ra. Vui lòng thử lại sau.', 'error');
    } finally {
      // Reset button and input state
      setTimeout(() => {
        subscribeButton.innerHTML = originalText;
        subscribeButton.style.opacity = '';
        subscribeButton.disabled = false;
        emailInput.disabled = false;
        provinceInput.disabled = false;
      }, 500);
    }
  }

  // Add shake animation for invalid input
  function shakeElement(element) {
    element.style.animation = 'none';
    setTimeout(() => {
      element.style.animation = 'shake 0.5s ease';
    }, 10);
  }

  // Add the shake animation style if it doesn't exist
  if (!document.getElementById('shake-animation-style')) {
    const style = document.createElement('style');
    style.id = 'shake-animation-style';
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Display subscription message for home_1.html
function showEmailSubscriptionMessage(message, type) {
  // Remove any existing message
  const existingMessage = document.querySelector('.email-subscription .subscription-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `subscription-message ${type}`;

  // Add icon to the message based on type
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg style="width:18px;height:18px;margin-right:8px;vertical-align:middle" viewBox="0 0 24 24"><path fill="#4ade80" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" /></svg>';
  } else {
    iconSvg = '<svg style="width:18px;height:18px;margin-right:8px;vertical-align:middle" viewBox="0 0 24 24"><path fill="#f87171" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>';
  }

  messageElement.innerHTML = iconSvg + message;

  // Add message to the container
  const subscriptionContainer = document.querySelector('.email-subscription');
  if (subscriptionContainer) {
    subscriptionContainer.appendChild(messageElement);

    // Add entrance animation
    setTimeout(() => {
      messageElement.style.transform = 'translateY(5px)';
      setTimeout(() => {
        messageElement.style.transform = '';
      }, 200);
    }, 10);

    // Scroll to message if not in view
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto remove message after 5 seconds
    setTimeout(() => {
      messageElement.classList.add('fade-out');
      setTimeout(() => messageElement.remove(), 500);
    }, 5000);
  }
}

// Hàm tạo dữ liệu giả cho thành phố TP Hồ Chí Minh nếu API bị lỗi
function generateHoChiMinhMockData() {
  // Dữ liệu mẫu cho TP Hồ Chí Minh - hơi cao và nóng
  const currentDate = new Date();
  const data = [];

  // Tạo dữ liệu cho 8 khoảng thời gian (mỗi 3 giờ)
  for (let i = 0; i < 8; i++) {
    const time = new Date(currentDate);
    time.setHours(i * 3);

    // Nhiệt độ dao động từ 29-35 độ, cao nhất vào buổi trưa
    let temperature = 30;
    const hourOfDay = time.getHours();

    if (hourOfDay >= 9 && hourOfDay <= 15) {
      // Buổi trưa nóng hơn
      temperature = 32 + Math.floor(Math.random() * 3);
    } else if (hourOfDay >= 18 || hourOfDay <= 3) {
      // Buổi tối/đêm mát hơn
      temperature = 28 + Math.floor(Math.random() * 2);
    } else {
      // Các giờ khác
      temperature = 29 + Math.floor(Math.random() * 3);
    }

    // Xác suất mưa cao hơn vào buổi chiều
    let precipitation = 0;
    if (hourOfDay >= 13 && hourOfDay <= 18) {
      precipitation = Math.random() * 0.8; // Mưa nhẹ đến trung bình
    } else {
      precipitation = Math.random() * 0.2; // Ít mưa
    }

    // Gió trung bình
    const windspeed = 5 + Math.floor(Math.random() * 5);

    // Mã thời tiết: 0-1 là nắng, 2-3 là mây, 61-65 là mưa
    let weatherCode = 1; // Mặc định là nắng
    if (precipitation > 0.4) {
      weatherCode = 61 + Math.floor(Math.random() * 4); // Mã mưa
    } else if (Math.random() > 0.7) {
      weatherCode = 2; // Đôi khi có mây
    }

    data.push({
      id: 1000 + i,
      province: "TP Hồ Chí Minh",
      time: time.toISOString(),
      temperature: temperature,
      temp_max: temperature + 1.5,
      temp_min: temperature - 1,
      precipitation: precipitation,
      windspeed_max: windspeed,
      uv_index_max: 8 + Math.random() * 3,
      sunshine_hours: 8 + Math.random() * 4,
      sundown_hours: 12,
      weather_code: weatherCode
    });
  }

  return data;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo đồng hồ
  const dayTimeElement = document.querySelector('.day-time span');
  updateClock(dayTimeElement);
  setInterval(() => updateClock(dayTimeElement), 1000);

  // Cải thiện hiệu ứng mưa
  enhanceRainAnimation();

  // Add styles for welcome template
  addWelcomeStyles();

  // Add styles for subscription messages
  addSubscriptionMessageStyles();

  // Initialize search when the DOM is fully loaded
  initializeSearch();

  // Initialize subscription form
  initializeSubscriptionForm();

  // Initialize email subscription form for home_1.html
  initializeEmailSubscription();

  // Bắt đầu cập nhật dữ liệu tự động mỗi 30 giây
  startAutomaticUpdates(30);

  // Handle window resize
  window.addEventListener('resize', () => {
    if (hasSearched && currentWeatherData) {
      // Redraw with actual weather data if available
      drawTemperatureLine(extractTemperatures(currentWeatherData));
      drawPrecipitationLine(extractPrecipitation(currentWeatherData));
      drawWindLine(extractWindspeeds(currentWeatherData));
    } else {
      // Otherwise use default values
      drawTemperatureLine();
      drawPrecipitationLine();
      drawWindLine();
    }
  });

  // Xử lý trường hợp API bị lỗi sau thời gian chờ
  setTimeout(() => {
    if (!currentWeatherData) {
      console.log('Sử dụng dữ liệu mặc định cho TP Hồ Chí Minh do API không phản hồi');
      const mockData = generateHoChiMinhMockData();
      currentWeatherData = mockData;
      hideWelcomeTemplate();
      updateWeatherUI(mockData);
      hasSearched = true;
    }
  }, 5000); // Đợi 5 giây nếu API không phản hồi
});

// Add a hover effect for precipitation bars
const precipitationValues = document.querySelectorAll('.precipitation-value');
precipitationValues.forEach(value => {
  value.addEventListener('mouseenter', () => {
    value.style.transform = 'translateY(-3px)';
    value.style.color = '#4285f4';
  });

  value.addEventListener('mouseleave', () => {
    value.style.transform = '';
    value.style.color = '';
  });
});


// Thêm hàm để lưu tỉnh thành đã xem gần đây vào localStorage
function saveRecentLocation(province) {
  try {
    let recentLocations = JSON.parse(localStorage.getItem('recentWeatherLocations')) || [];

    // Xóa vị trí này nếu đã tồn tại trong danh sách (để di chuyển lên đầu)
    recentLocations = recentLocations.filter(location => location !== province);

    // Thêm vào đầu danh sách
    recentLocations.unshift(province);

    // Giới hạn chỉ lưu tối đa 5 địa điểm gần đây
    if (recentLocations.length > 5) {
      recentLocations = recentLocations.slice(0, 5);
    }

    localStorage.setItem('recentWeatherLocations', JSON.stringify(recentLocations));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Cập nhật hàm fetchWeatherData để lưu địa điểm đã xem
async function fetchWeatherData(province) {
  // Cập nhật tỉnh hiện tại đang xem
  currentViewedProvince = province;
  
  // console.log(`Fetching weather data for ${province}...`);

  try {
    const url = `/api/get-weather-data/?province=${encodeURIComponent(province)}`;
    // console.log(`API URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    // console.log('Weather data received:', data);    

    // console.log(`Fetching forecast weather data for ${province}...`);
    const url_forecast_data = `/api/get-predict-weather-data/?province=${encodeURIComponent(province)}`;
    // console.log(`API URL_forecast_data: ${url_forecast_data}`);

    const response_forecast_data = await fetch(url_forecast_data, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response_forecast_data.ok) {
      throw new Error(`HTTP error! Status: ${response_forecast_data.status}`);
    }
    const forecast_data = await response_forecast_data.json();
    // console.log('Weather forecast data received:', forecast_data);


    if (data && data.length > 0) {
      hideWelcomeTemplate(); // Hide welcome template
      currentWeatherData = data;
      updateWeatherUI(currentWeatherData, forecast_data);

      // Lưu địa điểm đã xem vào localStorage
      saveRecentLocation(province);
    } else {
      console.error('Invalid weather data format:', data);
      showErrorMessage('Không tìm thấy dữ liệu thời tiết cho tỉnh này');
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);

    if (province === defaultCity) {
      // Nếu lỗi với thành phố mặc định, sử dụng dữ liệu giả
      console.log('Sử dụng dữ liệu mặc định cho TP Hồ Chí Minh do API lỗi');
      const mockData = generateHoChiMinhMockData();
      currentWeatherData = mockData;
      hideWelcomeTemplate();
      updateWeatherUI(mockData);
      hasSearched = true;
      saveRecentLocation(province);
    } else {
      showErrorMessage('Đã xảy ra lỗi khi tải dữ liệu thời tiết');
    }
  }
}

// Hàm bắt đầu cập nhật dữ liệu tự động (gọi sau khi init)
function startAutomaticUpdates(intervalInSeconds = 60) {
  // Dừng interval cũ nếu có
  stopAutomaticUpdates();
  
  // Tạo interval mới (chuyển đổi giây thành mili giây)
  weatherUpdateInterval = setInterval(() => {
    if (currentViewedProvince && hasSearched) {
      // console.log(`Đang tự động cập nhật dữ liệu cho ${currentViewedProvince}...`);
      fetchWeatherData(currentViewedProvince);
    }
  }, intervalInSeconds * 1000);
  
  // console.log(`Dữ liệu thời tiết sẽ được cập nhật tự động mỗi ${intervalInSeconds} giây.`);
}

// Hàm dừng cập nhật dữ liệu tự động
function stopAutomaticUpdates() {
  if (weatherUpdateInterval) {
    clearInterval(weatherUpdateInterval);
    weatherUpdateInterval = null;
    console.log('Đã dừng cập nhật dữ liệu tự động.');
  }
}

// Hàm thay đổi tần suất cập nhật
function changeUpdateFrequency(intervalInSeconds) {
  startAutomaticUpdates(intervalInSeconds);
}
