import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BusinessDetail from './pages/BusinessDetail';
import Booking from './pages/Booking';
import MyAppointments from './pages/MyAppointments';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import SystemAdmin from './pages/SystemAdmin';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ textAlign: 'center', padding: '4rem' }} className="text-muted">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="businesses/:id" element={<BusinessDetail />} />

            <Route path="businesses/:id/book" element={
              <ProtectedRoute><Booking /></ProtectedRoute>
            } />

            <Route path="my-appointments" element={
              <ProtectedRoute><MyAppointments /></ProtectedRoute>
            } />

            <Route path="profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />

            <Route path="dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />

            <Route path="system" element={
              <ProtectedRoute roles={['administrator']}><SystemAdmin /></ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
