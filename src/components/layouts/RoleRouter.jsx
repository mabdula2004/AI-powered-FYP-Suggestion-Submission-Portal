import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export default function RoleRouter() {
  const { profile } = useAuthStore()

  if (!profile || !profile.role) {
    return <Navigate to="/login" replace />
  }

  if (profile.role === 'student') {
    return <Navigate to="/student/dashboard" replace />
  }

  if (profile.role === 'supervisor') {
    return <Navigate to="/supervisor/dashboard" replace />
  }

  if (profile.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}
