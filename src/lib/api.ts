import axios, { type AxiosRequestConfig } from 'axios'
import type { ApiErrorBody } from '@/types'
import { clearToken, getToken } from './auth'
import { API_BASE_URL } from './config'

export class ApiError extends Error {
  status: number
  code: string
  errors?: Record<string, string>
  body: ApiErrorBody

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.errors = body.errors
    this.body = body
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Cancelled requests (TanStack Query passes an AbortSignal) are not API errors.
    if (axios.isCancel(error)) return Promise.reject(error)

    if (axios.isAxiosError<ApiErrorBody>(error)) {
      const status = error.response?.status ?? 0
      const data = error.response?.data
      if (status === 401) clearToken()

      const body: ApiErrorBody =
        data && typeof data.code === 'string'
          ? data
          : { code: 'NETWORK_ERROR', message: 'Não foi possível conectar ao servidor' }
      return Promise.reject(new ApiError(status, body))
    }
    return Promise.reject(error)
  },
)

export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig) => (await http.get<T>(url, config)).data,
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    (await http.post<T>(url, body, config)).data,
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    (await http.put<T>(url, body, config)).data,
  patch: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    (await http.patch<T>(url, body, config)).data,
  delete: async <T>(url: string, config?: AxiosRequestConfig) =>
    (await http.delete<T>(url, config)).data,
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}