import { useMutation, useQueryClient } from '@tanstack/react-query'

import { profileQuery } from '@/features/checkout/api'
import { api } from '@/lib/api'
import { clearToken } from '@/lib/auth'
import type { Profile } from '@/types'

export interface ProfileUpdate {
  displayName: string
  username: string
  email: string
  ensName: string
  ensSuffix: '.eth'
  walletNickname: string
}

function useProfileMutation<TInput>(request: (input: TInput) => Promise<Profile>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (profile) => queryClient.setQueryData(profileQuery.queryKey, profile),
  })
}

export function useUpdateProfile() {
  return useProfileMutation((input: ProfileUpdate) => api.patch<Profile>('/profile', input))
}

export function useUploadAvatar() {
  return useProfileMutation((file: File) => {
    const body = new FormData()
    body.append('avatar', file)
    // Let the browser set the multipart boundary.
    return api.put<Profile>('/profile/avatar', body, { headers: { 'Content-Type': undefined } })
  })
}

export function useRemoveAvatar() {
  return useProfileMutation(() => api.delete<Profile>('/profile/avatar'))
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api.post<void>('/profile/password', input),
  })
}

/** Ends the session and drops every cached response, so nothing private outlives it. */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSettled: () => {
      clearToken()
      queryClient.clear()
    },
  })
}
