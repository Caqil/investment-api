import { api } from "./auth";


export const userApi = {
  // Profile
  getProfile: () => api.get('/user/profile'),
  updateProfile: (profileData: any) => api.put('/user/profile', profileData),
  changePassword: (data: { current_password: string, new_password: string }) => 
    api.put('/user/change-password', data),
  
  // Deposits
  depositViaGateway: (gateway: string, amount: number) => 
    api.post(`/payments/deposit/${gateway}`, { amount }),
  depositViaManual: (data: any) => api.post('/payments/deposit/manual', data),
  
  // Withdrawals
  requestWithdrawal: (data: any) => api.post('/withdrawals', data),
  getWithdrawals: () => api.get('/withdrawals'),
  
  // KYC
  submitKYC: (kycData: any) => api.post('/kyc/submit', kycData),
  getKYCStatus: () => api.get('/kyc/status'),
  
  // Tasks
  getTasks: () => api.get('/tasks'),
  completeTask: (id: number) => api.post(`/tasks/${id}/complete`),
  
  // Plans
  getPlans: () => api.get('/plans'),
  purchasePlan: (id: number) => api.post(`/plans/${id}/purchase`),
  
  // Referrals
  getReferrals: () => api.get('/referrals'),
  getReferralEarnings: () => api.get('/referrals/earnings'),
  
  // Transactions
  getTransactions: () => api.get('/user/transactions'),
  
  // Notifications
  getNotifications: () => api.get('/user/notifications'),
  markNotificationAsRead: (id: number) => api.put(`/user/notifications/${id}/read`),
};