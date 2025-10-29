// API Configuration - автоматично определяне на правилния адрес
const getApiBaseUrl = (): string => {
  // Проверяваме дали сме в браузър
  if (typeof window === 'undefined') {
    return 'http://lager.local:5000/api';
  }

  const hostname = window.location.hostname;
  const port = window.location.port;

  // Ако използваме lager.local
  if (hostname === 'lager.local') {
    return 'http://lager.local:5000/api';
  }

  // Ако използваме localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }

  // Ако използваме IP адрес (за мобилни устройства)
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return `http://${hostname}:5000/api`;
  }

  // Fallback към lager.local
  return 'http://lager.local:5000/api';
};

export const API_BASE = getApiBaseUrl();

// Debug информация
if (typeof window !== 'undefined') {
  console.log('🌐 API Base URL:', API_BASE);
  console.log('📍 Current hostname:', window.location.hostname);
  console.log('📍 Current port:', window.location.port);
  console.log('📍 Full URL:', window.location.href);
  
  // Тест на API свързаност
  fetch(`${API_BASE.replace('/api', '')}/api/health`)
    .then(response => response.json())
    .then(data => console.log('✅ API Health Check:', data))
    .catch(error => console.error('❌ API Health Check Failed:', error));
}
