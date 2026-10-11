import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './firebase/AuthContext'
import { SettingsProvider } from './firebase/SettingsContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/AdminLogin'
import MedicoLogin from './pages/MedicoLogin'
import SecretariaLogin from './pages/SecretariaLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminDoctors from './pages/AdminDoctors'
import AdminDoctorEdit from './pages/AdminDoctorEdit'
import AdminSettings from './pages/AdminSettings'
import AdminContent from './pages/AdminContent'
import AdminLaboratorio from './pages/AdminLaboratorio'
import AdminDemoData from './pages/AdminDemoData'
import MedicoDashboard from './pages/MedicoDashboard'
import MedicoProfileEdit from './pages/MedicoProfileEdit'
import SecretariaDashboard from './pages/SecretariaDashboard'
import BookAppointment from './pages/BookAppointment'
import './styles/global.scss'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/turno" element={<BookAppointment />} />

          <Route path="/login/administrador" element={<AdminLogin />} />
          <Route path="/login/medicos" element={<MedicoLogin />} />
          <Route path="/login/secretarias" element={<SecretariaLogin />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/medicos"
            element={
              <ProtectedRoute role="admin">
                <AdminDoctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/medicos/:doctorId"
            element={
              <ProtectedRoute role="admin">
                <AdminDoctorEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/configuracion"
            element={
              <ProtectedRoute role="admin">
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contenido"
            element={
              <ProtectedRoute role="admin">
                <AdminContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/laboratorio"
            element={
              <ProtectedRoute role="admin">
                <AdminLaboratorio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/demo"
            element={
              <ProtectedRoute role="admin">
                <AdminDemoData />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute role="admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medico"
            element={
              <ProtectedRoute role="medico">
                <MedicoDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medico/perfil"
            element={
              <ProtectedRoute role="medico">
                <MedicoProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretaria"
            element={
              <ProtectedRoute role="secretaria">
                <SecretariaDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
