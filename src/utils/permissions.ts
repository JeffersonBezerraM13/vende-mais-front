import type { UserResponseDTO, UserRole } from '@/types/api'

export function hasRole(user: UserResponseDTO | null, role: UserRole) {
  return user?.roles.includes(role) ?? false
}

export function isAdmin(user: UserResponseDTO | null) {
  return hasRole(user, 'ADMIN')
}
