// API Configuration
// Update this with your Laravel API URL

// For Android emulator, use: http://10.0.2.2:8000/api
// For iOS simulator, use: http://localhost:8000/api
// For physical device, use your computer's IP: http://YOUR_IP:8000/api

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://api.test/api' // Android emulator
    : 'http://api.test/api' // iOS simulator
  : 'https://admin.stepra.com/api'; // Production
