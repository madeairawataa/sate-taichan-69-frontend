import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import AdminMenu from './AdminMenu';
import AdminReservasi from './AdminReservasi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Styles/Admin.css';

// Socket client untuk real-time update (pesanan & reservasi)
const socket = io('taichan69-backend.vercel.app');

function AdminDashboard() {
  const [tab, setTab] = useState('pesanan');
  

  useEffect(() => {
    // Socket ini hanya kirim update data ke komponen anak
    // Tidak menangani badge notif di filter/tab
    return () => {
      socket.off('updatePesanan');
      socket.off('notifikasi');
    };
  }, []);

  return (
    <>
      <Navbar />

      <div className="admin-dashboard">
        <h2>Daftar Pesanan Dan Reservasi</h2>

        <div className="admin-tabs fixed-tabs">
          <button onClick={() => setTab('pesanan')} className={tab === 'pesanan' ? 'active' : ''}>
            Pemesanan Makanan
          </button>
          <button onClick={() => setTab('reservasi')} className={tab === 'reservasi' ? 'active' : ''}>
            Reservasi Meja
          </button>
        </div>

        {tab === 'pesanan' && <AdminMenu socket={socket} setTab={setTab} />}
        {tab === 'reservasi' && <AdminReservasi socket={socket} setTab={setTab} />}
      </div>

      <Footer />
    </>
  );
}

export default AdminDashboard;
