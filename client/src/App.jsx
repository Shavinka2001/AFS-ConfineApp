import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Unauthorized from './components/Unauthorized';
import AdminDashboard from './components/dashboards/admin/AdminDashboard';
import AdminWorkOrders from './components/dashboards/admin/AdminWorkOrders';
import UserManagement from './components/dashboards/admin/UserManagement';
import ManagerDashboard from './components/dashboards/manager/ManagerDashboard';
import ManagerUserManagement from './components/dashboards/manager/ManagerUserManagement';
import ManagerWorkOrders from './components/dashboards/manager/ManagerWorkOrders';
import TechnicianDashboard from './components/dashboards/technician/TechnicianDashboard';
import TechnicianSettings from './components/dashboards/technician/TechnicianSettings';
import TechnicianForm from './components/dashboards/technician/TechnicianForm';
import TechnicianWorkOrders from './components/dashboards/technician/TechnicianWorkOrders';
import TechnicianTasks from './components/dashboards/technician/TechnicianTasks';
import UserDashboard from './components/dashboards/user/UserDashboard';
import LocationManagement from './components/location/LocationManagement';
import TechnicianLocationMap from './components/location/TechnicianLocationMap';

// Unauthorized page component
const UnauthorizedFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
    <div className="text-center">
      <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-8">You don't have permission to access this resource.</p>
      <button
        onClick={() => window.history.back()}
        className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

// 404 Not Found page component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-1.01-6-2.709M4 12a8 8 0 1116 0 8 8 0 01-16 0z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => window.location.href = '/'}
        className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
      >
        Go Home
      </button>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes with Layout */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/work-orders"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <AdminWorkOrders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/locations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Layout>
                    <LocationManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <Layout>
                    <ManagerDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/manager/users"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <Layout>
                    <ManagerUserManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/manager/work-orders"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <Layout>
                    <ManagerWorkOrders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/technician/dashboard"
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <Layout>
                    <TechnicianDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/technician/settings"
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <Layout>
                    <TechnicianSettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/technician/inspection-forms"
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <Layout>
                    <TechnicianForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/technician/work-orders"
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <Layout>
                    <TechnicianWorkOrders />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/technician/tasks"
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <Layout>
                    <TechnicianTasks />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/technician/location-map"
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <Layout>
                    <TechnicianLocationMap />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Layout>
                    <UserDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Placeholder routes for other pages */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                      <p className="text-gray-600 mt-2">This section is under development.</p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/manager/*"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <Layout>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold text-gray-900">Manager Panel</h1>
                      <p className="text-gray-600 mt-2">This section is under development.</p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/technician/*"
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <Layout>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold text-gray-900">Technician Panel</h1>
                      <p className="text-gray-600 mt-2">This section is under development.</p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
