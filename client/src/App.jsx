import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Layouts and Pages
import DashboardLayout from './layouts/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Objectives from './pages/Objectives';
import History from './pages/History';
import Groups from './pages/Groups';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user?.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { user } = useContext(AuthContext);
  const isAuthenticated = Boolean(user?.token);

  return (
    <Routes>
      <Route path="/" element={!isAuthenticated ? <Landing /> : <Navigate to="/objectives" replace />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/objectives" replace />} />

      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/objectives" element={<Objectives />} />
        <Route path="/history" element={<History />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/objectives' : '/'} replace />} />
    </Routes>
  );
}

export default App;
