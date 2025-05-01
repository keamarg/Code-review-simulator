import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  
  // Show loading indicator while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  // If not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If authenticated, render the child routes
  return <Outlet />
}