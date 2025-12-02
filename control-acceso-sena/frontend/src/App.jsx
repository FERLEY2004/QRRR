import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Visitors from './pages/Visitors';
import Reports from './pages/Reports';
import ReportsDashboard from './pages/ReportsDashboard';
import PeopleSearch from './pages/PeopleSearch';
import AccessHistory from './pages/AccessHistory';
import ProgramCatalog from './pages/ProgramCatalog';
import FichaCatalog from './pages/FichaCatalog';
import AdminPanel from './pages/AdminPanel';
import ImportWizard from './components/import/ImportWizard';
import LogsViewer from './pages/LogsViewer';
import ProtectedRoute from './components/ProtectedRoute';

// Componente para manejar la redirección de la ruta raíz
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, redirigir al dashboard
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-100">
                  <Navbar />
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/scanner" element={<Scanner />} />
                    <Route path="/visitors" element={<Visitors />} />
                    <Route path="/reports" element={<ProtectedRoute requireAdmin><Reports /></ProtectedRoute>} />
                    <Route path="/reports-dashboard" element={<ProtectedRoute requireAdmin><ReportsDashboard /></ProtectedRoute>} />
                    <Route path="/people-search" element={<ProtectedRoute requireAdmin><PeopleSearch /></ProtectedRoute>} />
                    <Route path="/access-history" element={<ProtectedRoute requireAdmin><AccessHistory /></ProtectedRoute>} />
                    <Route path="/program-catalog" element={<ProtectedRoute requireAdmin><ProgramCatalog /></ProtectedRoute>} />
                    <Route path="/fichas" element={<ProtectedRoute requireAdmin><FichaCatalog /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
                    <Route path="/import" element={<ProtectedRoute requireAdmin><ImportWizard /></ProtectedRoute>} />
                    <Route path="/logs" element={<ProtectedRoute requireAdmin><LogsViewer /></ProtectedRoute>} />
                  </Routes>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;