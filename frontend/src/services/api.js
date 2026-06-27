import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout for quick fallback
});

// Axios Request Interceptor (attaches Bearer token if user is authenticated)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const apiService = {
  getDashboard: async () => {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.warn('FastAPI Dashboard endpoint offline, using fallback data:', error.message);
      return null;
    }
  },
  
  getMonitoring: async () => {
    try {
      const response = await apiClient.get('/monitoring');
      return response.data;
    } catch (error) {
      console.warn('FastAPI Monitoring endpoint offline, using fallback data:', error.message);
      return null;
    }
  },

  getHistory: async () => {
    try {
      const response = await apiClient.get('/history');
      return response.data;
    } catch (error) {
      console.warn('FastAPI History endpoint offline, using fallback data:', error.message);
      return null;
    }
  },

  getAlerts: async () => {
    try {
      const response = await apiClient.get('/alerts');
      return response.data;
    } catch (error) {
      console.warn('FastAPI Alerts endpoint offline, using fallback data:', error.message);
      return null;
    }
  },

  getReports: async () => {
    try {
      const response = await apiClient.get('/reports');
      return response.data;
    } catch (error) {
      console.warn('FastAPI Reports endpoint offline, using fallback data:', error.message);
      return null;
    }
  },

  getProfile: async () => {
    try {
      const response = await apiClient.get('/profile');
      return response.data;
    } catch (error) {
      console.warn('FastAPI Profile endpoint offline, using fallback data:', error.message);
      return null;
    }
  },

  getDevices: async () => {
    try {
      const response = await apiClient.get('/devices');
      return response.data;
    } catch (error) {
      console.warn('FastAPI Devices endpoint offline, using fallback data:', error.message);
      return null;
    }
  },

  getDeviceTelemetry: async (deviceId) => {
    try {
      const response = await apiClient.get(`/device/telemetry/${deviceId}`);
      return response.data;
    } catch (error) {
      console.warn(`FastAPI Telemetry endpoint offline for device ${deviceId}:`, error.message);
      return null;
    }
  },

  getAiPrediction: async (deviceId) => {
    try {
      const response = await apiClient.get(`/ai/predict/${deviceId}`);
      return response.data;
    } catch (error) {
      // Fallback AI prediction format if backend endpoint is initializing
      return {
        prediction: "Normal",
        confidence: 98.7,
        risk_score: 5,
        severity: "Low",
        last_prediction_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    }
  },

  getAiHistory: async (deviceId) => {
    try {
      const response = await apiClient.get(`/ai/history/${deviceId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  getLatestNetworkFeatures: async () => {
    try {
      const response = await apiClient.get('/network/latest-features');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  getNetworkFlows: async () => {
    try {
      const response = await apiClient.get('/network/flows');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getNetworkStats: async () => {
    try {
      const response = await apiClient.get('/network/stats');
      return response.data;
    } catch (error) {
      return { active_flows: 0, packets_captured: 0, packets_per_sec: 0, flows_processed: 0, last_extraction_time: '--' };
    }
  },
};

export default apiClient;
