import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8787/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mamacare_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
}

export const careApi = {
  mothers: () => api.get('/mothers'),
  registerMother: (payload) => api.post('/mothers', payload),
  visits: () => api.get('/visits'),
  saveVisit: (payload) => api.post('/visits', payload),
  reportSummary: () => api.get('/reports/summary'),
}

export const assessmentApi = {
  analyze: (payload) => api.post('/ai/assess', payload),
  transcribe: (formData) => api.post('/ai/transcribe', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const translationApi = {
  catalog: (payload) => api.post('/ai/translate-catalog', payload),
}

export default api
