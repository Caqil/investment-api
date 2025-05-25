// lib/user-api.ts
import { api } from "@/providers/auth-provider";

// User API service
export const userApi = {
  // Profile
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: any) => api.put("/user/profile", data),
  uploadProfilePicture: (formData: FormData) => api.post("/user/profile/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }),
  changePassword: (data: { current_password: string; new_password: string }) => 
    api.put("/user/change-password", data),
  enableBiometric: () => api.post("/user/enable-biometric"),
  disableBiometric: () => api.post("/user/disable-biometric"),

  // Deposit
  depositViaGateway: (gateway: string, amount: number) => 
    api.post(`/payments/deposit/${gateway}`, { amount }),
  depositViaManual: (data: any) => api.post("/payments/deposit/manual", data),
  uploadReceipt: (formData: FormData) => api.post("/payments/upload-receipt", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }),

  // Withdrawal
  requestWithdrawal: (data: any) => api.post("/withdrawals", data),
  getWithdrawals: () => api.get("/withdrawals"),
  getWithdrawalLimits: () => api.get("/withdrawals/limits"),

  // Tasks
  getTasks: () => api.get("/tasks"),
  completeTask: (taskId: number) => api.post(`/tasks/${taskId}/complete`),

  // KYC
  getKYCStatus: () => api.get("/kyc/status"),
  submitKYC: (data: any) => api.post("/kyc/submit", data),
  uploadKYCDocument: (formData: FormData) => api.post("/kyc/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }),

  // Transactions
  getTransactions: () => api.get("/user/transactions"),
  
  // Dashboard
  getDashboardStats: () => api.get("/user/dashboard/stats"),

  // Referrals
  getReferrals: () => api.get("/referrals"),
  getReferralEarnings: () => api.get("/referrals/earnings"),
};