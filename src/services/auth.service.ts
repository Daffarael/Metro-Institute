import api from '@/lib/axios'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { name: string; email: string; phone: string; password: string }

export const authService = {
  login: (data: LoginPayload) =>
    api.post('/auth/login', data).then((r) => r.data),

  register: (data: RegisterPayload) =>
    api.post('/auth/register', data).then((r) => r.data),

  loginGoogle: () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
  },

  logout: () => api.post('/auth/logout').then((r) => r.data),

  refresh: () => api.post('/auth/refresh').then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`).then((r) => r.data),

  resendVerify: (email: string) =>
    api.post('/auth/resend-verify', { email }).then((r) => r.data),

  getMe: () => api.get('/users/me').then((r) => r.data),
}
