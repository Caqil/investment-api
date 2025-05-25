
import { api } from './auth';

export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Users
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getUserById: (id: number) => api.get(`/admin/users/${id}`),
  blockUser: (id: number) => api.put(`/admin/users/${id}/block`),
  unblockUser: (id: number) => api.put(`/admin/users/${id}/unblock`),
  
  // Withdrawals
  getWithdrawals: (params?: any) => api.get('/admin/withdrawals', { params }),
  getWithdrawalById: (id: number) => api.get(`/admin/withdrawals/${id}`),
  approveWithdrawal: (id: number, adminNote: string) => 
    api.put(`/admin/withdrawals/${id}/approve`, { admin_note: adminNote }),
  rejectWithdrawal: (id: number, reason: string) => 
    api.put(`/admin/withdrawals/${id}/reject`, { reason }),
  
  // KYC
  getKYCSubmissions: (params?: any) => api.get('/admin/kyc', { params }),
  getKYCById: (id: number) => api.get(`/admin/kyc/${id}`),
  approveKYC: (id: number) => api.put(`/admin/kyc/${id}/approve`),
  rejectKYC: (id: number, reason: string) => 
    api.put(`/admin/kyc/${id}/reject`, { reason }),
  
  // Plans
  getPlans: () => api.get('/admin/plans'),
  getPlanById: (id: number) => api.get(`/admin/plans/${id}`),
  createPlan: (planData: any) => api.post('/admin/plans', planData),
  updatePlan: (id: number, planData: any) => api.put(`/admin/plans/${id}`, planData),
  deletePlan: (id: number) => api.delete(`/admin/plans/${id}`),
  
  // Tasks
  getTasks: () => api.get('/admin/tasks'),
  getTaskById: (id: number) => api.get(`/admin/tasks/${id}`),
  createTask: (taskData: any) => api.post('/admin/tasks', taskData),
  updateTask: (id: number, taskData: any) => api.put(`/admin/tasks/${id}`, taskData),
  deleteTask: (id: number) => api.delete(`/admin/tasks/${id}`),
  
  // Transactions
  getTransactions: (params?: any) => api.get('/admin/transactions', { params }),
  getTransactionById: (id: number) => api.get(`/admin/transactions/${id}`),
  
  // Notifications
  sendNotification: (data: { title: string, message: string }) => 
    api.post('/admin/notifications', data),
};