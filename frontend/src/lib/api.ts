import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken
        });
        
        localStorage.setItem('token', data.accessToken);
        api.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: { email: string; password: string; username: string }) =>
    api.post('/auth/register', userData),
  
  googleAuth: (token: string) =>
    api.post('/auth/google', { token }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken })
};

export const postsAPI = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/posts', { params }),
  
  getById: (id: string) =>
    api.get(`/posts/${id}`),
  
  create: (formData: FormData) =>
    api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  delete: (id: string) =>
    api.delete(`/posts/${id}`),
  
  like: (id: string) =>
    api.post(`/posts/${id}/like`),
  
  unlike: (id: string) =>
    api.delete(`/posts/${id}/like`)
};

export const commentsAPI = {
  getByPost: (postId: string) =>
    api.get(`/posts/${postId}/comments`),
  
  create: (postId: string, formData: FormData) =>
    api.post(`/posts/${postId}/comments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  delete: (postId: string, commentId: string) =>
    api.delete(`/posts/${postId}/comments/${commentId}`)
};

export const usersAPI = {
  getProfile: (userId?: string) =>
    api.get(userId ? `/users/${userId}` : '/users/me'),
  
  updateProfile: (formData: FormData) =>
    api.put('/users/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  search: (query: string) =>
    api.get('/users/search', { params: { q: query } })
};

export const connectionsAPI = {
  getFollowers: (userId?: string) =>
    api.get(userId ? `/users/${userId}/followers` : '/connections/followers'),
  
  getFollowing: (userId?: string) =>
    api.get(userId ? `/users/${userId}/following` : '/connections/following'),
  
  follow: (userId: string) =>
    api.post(`/connections/${userId}/follow`),
  
  unfollow: (userId: string) =>
    api.delete(`/connections/${userId}/follow`)
};

export const contactAPI = {
  reveal: (userId: string) =>
    api.post(`/contact/${userId}/reveal`)
};
