import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Navbar.css';
import { io } from 'socket.io-client';

const Navbar = () => {
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginNotif, setShowLoginNotif] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifList, setNotifList] = useState([]);
  const [showNotifBox, setShowNotifBox] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

  useEffect(() => {
    setUsername(localStorage.getItem('username'));
    setRole(localStorage.getItem('role'));

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchNotifikasi = async () => {
    try {
      const res = await fetch('taichan69-backend.vercel.app/notifikasi/admin', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      const list = data.map((n) => ({
        id: n._id,
        waktu: new Date(n.waktu).toLocaleTimeString('id-ID'),
        jenis: n.jenis,
        pesan: n.pesan,
        terbaca: n.terbaca,
      }));
      setNotifList(list);
      const unread = list.filter((n) => !n.terbaca).length;
      setNotifCount(unread);
    } catch (error) {
      console.error('❌ Gagal ambil notifikasi:', error);
    }
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchNotifikasi();
    }
  }, [role]);

  useEffect(() => {
    if (role !== 'admin') return;

    const socket = io('taichan69-backend.vercel.app');
    socket.on('notifikasi', () => {
      fetchNotifikasi();
    });

    return () => socket.disconnect();
  }, [role]);

  const handleToggleNotifBox = async () => {
    const next = !showNotifBox;
    setShowNotifBox(next);

    if (next) {
      try {
        await fetch('taichan69-backend.vercel.app/notifikasi/admin/terbaca', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        await fetchNotifikasi();
      } catch (err) {
        console.error('❌ Gagal update notifikasi terbaca:', err);
      }
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('taichan69-backend.vercel.app/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Hapus semua data autentikasi dari localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('adminSoundEnabled');
      localStorage.removeItem('userId'); // Pastikan userId juga dihapus
      // Hapus semua data lain yang mungkin tersimpan (opsional)
      // localStorage.clear(); // Gunakan ini jika ingin hapus semua, tapi hati-hati karena akan hapus reservationDetails juga

      // Reset state aplikasi
      setUsername(null);
      setRole(null);
      setNotifList([]);
      setNotifCount(0);
      setShowNotifBox(false);

      // Redirect ke halaman utama
      navigate('/');
    } catch (error) {
      console.error('❌ Gagal logout:', error);
      alert('Gagal logout. Periksa koneksi internet kamu.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleReservasiClick = () => {
    if (!localStorage.getItem('token')) {
      setShowLoginNotif(true);
    } else {
      navigate('/reservasi');
    }
  };

  const renderUserMenu = () => (
    <>
      <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
      <a href="/menu" onClick={() => setMenuOpen(false)}>Pesan Menu</a>
      <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); handleReservasiClick(); }}>
        Reservasi Meja
      </a>
      {username && role !== 'admin' && (
        <a href="/history" onClick={() => setMenuOpen(false)}>Riwayat Pemesanan</a>
      )}
    </>
  );

  const renderAdminMenu = () => (
    <>
      <a href="/admin/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a>
      <a href="/admin/pesanan" onClick={() => { setMenuOpen(false); setShowNotifBox(false); }}>
        Daftar Pesanan & Reservasi
      </a>
      <a href="/admin/menu" onClick={() => setMenuOpen(false)}>Kelola Menu</a>
      <a href="/admin/meja" onClick={() => setMenuOpen(false)}>Kelola Meja</a>
    </>
  );

  return (
    <>
      {isLoggingOut && (
        <div className="logout-overlay">
          <div className="logout-message">
            <p>Mohon tunggu</p>
          </div>
        </div>
      )}

      <nav className="navbar">
        <div className="navbar-logo">
          <a href="/">Sate Taichan 69</a>
        </div>

        {role === 'admin' && (
          <div className="navbar-notif">
            <div className="notif-bell" onClick={handleToggleNotifBox}>
              🔔
              {notifCount > 0 && <span className="notif-count">{notifCount}</span>}
              {showNotifBox && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <strong>Notifikasi</strong>
                    <div className="notif-actions-inline">
                      <button onClick={() => setShowNotifBox(false)}>Tutup</button>
                      <button
                        onClick={async () => {
                          try {
                            await fetch('taichan69-backend.vercel.app/notifikasi/admin', {
                              method: 'DELETE',
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                              },
                            });
                            setNotifList([]);
                            setNotifCount(0);
                          } catch (err) {
                            alert('Gagal menghapus notifikasi.');
                          }
                        }}
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>
                  <ul style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifList.length === 0 ? (
                      <li className="notif-empty">Tidak ada notifikasi.</li>
                    ) : (
                      notifList.map((n) => (
                        <li key={n.id} className={`notif-item ${n.terbaca ? '' : 'unread'}`}>
                          <div>
                            <strong>{n.jenis}</strong> — {n.pesan}
                          </div>
                          <small>{n.waktu}</small>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</div>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          {menuOpen && isMobile && username && <div className="user-identity">{username}</div>}

          {menuOpen && isMobile && role === 'admin' && (
            <div className="notif-link" onClick={handleToggleNotifBox}>
              <span className="notif-icon">
                🔔
                {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
              </span>
              Notifikasi
            </div>
          )}

          {role === 'admin' ? renderAdminMenu() : renderUserMenu()}

          {!username ? (
            <a href="/login" onClick={() => setMenuOpen(false)}>Login</a>
          ) : (
            !isMobile ? (
              <div className="dropdown">
                <button className="dropbtn">{username} ⌄</button>
                <div className="dropdown-content">
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </div>
            ) : (
              <button onClick={handleLogout} className="nav-button-link">Logout</button>
            )
          )}
        </div>
      </nav>

      {showLoginNotif && (
        <div className="notif-overlay">
          <div className="notif-card">
            <h3>Login Diperlukan</h3>
            <p>Untuk melakukan reservasi meja, kamu harus login terlebih dahulu.</p>
            <div className="notif-actions">
              <button onClick={() => navigate('/login')}>Login</button>
              <button onClick={() => setShowLoginNotif(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;