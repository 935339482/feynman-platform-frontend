// src/api/axios.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 添加一个请求拦截器：每次发请求前，自动从 localStorage 取 token 放进请求头
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token; // 后端 auth 中间件支持此请求头
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
