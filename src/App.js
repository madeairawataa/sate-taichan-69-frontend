import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './home/Home';
import Menu from './home/Menu';
import Reservasi from './home/Reservasi';
import Login from './auth/Login';
import Register from './auth/Register';
import ForgotPassword from './auth/ForgotPassword';
import AdminDaftarPesanan from './admin/AdminDaftarPesanan';
import AdminKelolaMenu from './admin/AdminKelolaMenu';
import StatusPesanan from './home/StatusPesanan';
import Dashboard from './admin/Dashboard';
import AdminKelolaMeja from './admin/AdminKelolaMeja';
import ProtectedAdminRoute from './middleware/ProtectedAdminRoute';
import ProtectedUserRoute from './middleware/ProtectedUserRoute';
import History from './home/History';
import NotificationAudio from './components/NotificationAudio';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      // Generate UUID jika belum ada
      if (!localStorage.getItem('userUUID')) {
        const uuid = crypto.randomUUID();
        localStorage.setItem('userUUID', uuid);
      }

      // Cek role admin
      const role = localStorage.getItem('role');
      setIsAdmin(role === 'admin');
    } catch (error) {
      console.error('Error in App useEffect:', error);
    }
  }, []);

  return (
    <Router>
      {isAdmin && <NotificationAudio />}
      <div className="App">
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/reservasi" element={<Reservasi />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/status" element={<StatusPesanan />} />
          <Route path="/history" element={<ProtectedUserRoute><History /></ProtectedUserRoute>} />
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/pesanan" element={<ProtectedAdminRoute><AdminDaftarPesanan /></ProtectedAdminRoute>} />
          <Route path="/admin/menu" element={<ProtectedAdminRoute><AdminKelolaMenu /></ProtectedAdminRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/meja" element={<ProtectedAdminRoute><AdminKelolaMeja /></ProtectedAdminRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;