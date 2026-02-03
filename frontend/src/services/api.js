import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/token', formData);
    return response.data;
};

export const fetchDashboardData = async () => {
    const response = await api.get('/dashboard');
    return response.data;
};

export const exportCSV = async () => {
    const response = await api.get('/export', {
        responseType: 'blob',
    });
    return response.data;
};

export default api;
