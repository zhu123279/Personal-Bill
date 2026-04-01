import api from './api';

export const billService = {
  async getBills(params = {}) {
    const response = await api.get('/bills', { params });
    return response.data;
  },

  async getBill(id) {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },

  async createBill(data) {
    const response = await api.post('/bills', data);
    return response.data;
  },

  async updateBill(id, data) {
    const response = await api.put(`/bills/${id}`, data);
    return response.data;
  },

  async deleteBill(id) {
    const response = await api.delete(`/bills/${id}`);
    return response.data;
  },

  async importBills(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/bills/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async batchSaveBills(bills) {
    const response = await api.post('/bills/batch', { bills });
    return response.data;
  },

  async batchDeleteBills(ids) {
    const response = await api.post('/bills/batch-delete', { ids });
    return response.data;
  },

  async batchUpdateBills(ids, updateData) {
    const response = await api.post('/bills/batch-update', { ids, updateData });
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/categories/all');
    return response.data;
  }
};

export default billService;
