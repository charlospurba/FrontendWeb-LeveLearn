import axios from "axios";

const API_BASE_URL = "http://72.60.198.84:7000/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, 
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error("Request Timeout: Server memakan waktu terlalu lama.");
    }
    return Promise.reject(error);
  }
);

export default api;