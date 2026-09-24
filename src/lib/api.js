import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://shop-price-manager.vercel.app/api/store',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const sendOtp = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOtp = (phone, otp, firebaseToken, firebaseUid) =>
  api.post('/auth/verify-otp', { phone, otp, firebaseToken, firebaseUid });
export const getStoreInfo = () => api.get('/info');
export const getCatalog = (params) => api.get('/catalog', { params });
export const getCategories = () => api.get('/categories').catch(() => api.get('/catalog/categories'));
export const getSubcategories = (categoryId) =>
  api.get('/subcategories', { params: categoryId ? { category: categoryId } : {} });
export const validateCart = (items) => api.post('/cart/validate', { items });
export const placeOrder = (orderData) => api.post('/orders', orderData);
export const getMyOrders = () => api.get('/orders/my').catch(() => api.get('/orders/me'));
export const getOrderById = (id) => api.get(`/orders/${id}`);

// Admin API
export const getAdminItems = () => api.get('/admin/items');
export const updateAdminItem = (id, data) => api.put(`/admin/items/${id}`, data);
export const getAdminOrders = (params) => api.get('/admin/orders', { params });
export const updateAdminOrder = (id, data) => api.put(`/admin/orders/${id}`, data);
export const getDeliveryPersonnel = () => api.get('/admin/delivery-personnel');
export const getAdminSettings = () => api.get('/admin/settings');
export const updateAdminSettings = (data) => api.put('/admin/settings', data);
export const getAdminUsers = () => api.get('/admin/users');
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}`, data);

// Admin Category & Subcategory API
export const getAdminCategories = () => api.get('/admin/categories');
export const createAdminCategory = (data) => api.post('/admin/categories', data);
export const updateAdminCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const deleteAdminCategory = (id) => api.delete(`/admin/categories/${id}`);

export const getAdminSubcategories = (categoryId) =>
  api.get('/admin/subcategories', { params: categoryId ? { category: categoryId } : {} });
export const createAdminSubcategory = (data) => api.post('/admin/subcategories', data);
export const updateAdminSubcategory = (id, data) => api.put(`/admin/subcategories/${id}`, data);
export const deleteAdminSubcategory = (id) => api.delete(`/admin/subcategories/${id}`);

// Delivery API
export const getDeliveryOrders = (params) => api.get('/delivery/orders', { params });
export const updateDeliveryOrderStatus = (id, status, note) =>
  api.put(`/delivery/orders/${id}/status`, { status, note });

export default api;
