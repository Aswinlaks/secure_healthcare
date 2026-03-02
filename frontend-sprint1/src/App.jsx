import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BookAppointment from './pages/BookAppointment';
import PatientDiagnosis from './pages/PatientDiagnosis';
import CarePlanReview from './pages/CarePlanReview';
import PatientCareView from './pages/PatientCareView';
import OrderLab from './pages/OrderLab';
import DoctorAvailability from './pages/DoctorAvailability';
import AuditLogs from './pages/AuditLogs';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AIBotPage from './pages/AIBotPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/book-appointment"
            element={
              <ProtectedRoute allowedRoles={['Patient', 'User', 'USER', 'PATIENT']}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/patient/:id/diagnosis"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR']}>
                  <PatientDiagnosis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id/review-plan"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR']}>
                  <CarePlanReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id/order-lab"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR']}>
                  <OrderLab />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id/care-plan"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR', 'Patient', 'PATIENT']}>
                  <PatientCareView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/availability"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR']}>
                  <DoctorAvailability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-bot"
              element={
                <ProtectedRoute allowedRoles={['Doctor', 'DOCTOR', 'Patient', 'PATIENT']}>
                  <AIBotPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
