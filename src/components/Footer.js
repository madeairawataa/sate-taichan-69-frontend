import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Footer.css';

function Footer() {
  const navigate = useNavigate();
  const [showLoginNotif, setShowLoginNotif] = useState(false);
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    setRole(userRole);
    setIsLoggedIn(!!token && userRole === 'user');
  }, []);

  const handleReservasiClick = () => {
    if (!localStorage.getItem('token')) {
      setShowLoginNotif(true);
    } else {
      navigate('/reservasi');
    }
  };

  const handleHistoryClick = () => {
    if (!localStorage.getItem('token')) {
      setShowLoginNotif(true);
    } else {
      navigate('/history');
    }
  };

  return (
    <>
      <footer className="footer-streetfood">
        <div className="footer-container">
          <div className="footer-column logo-column">
            <h2 className="footer-brand">Sate Taichan 69</h2>
          </div>

          <div className="footer-column">
            <h4>Layanan</h4>
            <ul>
              <li><a href="/register">Registrasi</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/menu">Pesan Menu</a></li>
              <li>
                <button onClick={handleReservasiClick} className="footer-button-link">
                  Reservasi Meja
                </button>
              </li>
              {isLoggedIn && (
                <li>
                  <button onClick={handleHistoryClick} className="footer-button-link">
                    Riwayat Pemesanan
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="footer-column">
            <h4>Alamat</h4>
            <p>Mertasari Culinary Center, Pantai Mertasari, Sanur, Bali</p>
            <p>
              Instagram:{' '}
              <a href="https://instagram.com/sate.taichan.69" target="_blank" rel="noreferrer">
                @sate.taichan.69
              </a>
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Sate Taichan 69. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Notifikasi Login */}
      {showLoginNotif && (
        <div className="notif-overlay">
          <div className="notif-card">
            <h3>Login Diperlukan</h3>
            <p>Untuk mengakses fitur ini, kamu harus login terlebih dahulu.</p>
            <div className="notif-actions">
              <button onClick={() => navigate('/login')}>Login</button>
              <button onClick={() => setShowLoginNotif(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;
