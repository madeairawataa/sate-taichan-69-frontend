import React, { useState, useEffect } from 'react';
import AdminMenu from './AdminMenu';
import AdminReservasi from './AdminReservasi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Styles/Admin.css';

// Socket client untuk real-time update (pesanan & reservasi)


function AdminDashboard() {
  const [tab, setTab] = useState('pesanan');
  


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

        {tab === 'pesanan' && <AdminMenu  setTab={setTab} />}
        {tab === 'reservasi' && <AdminReservasi setTab={setTab} />}
      </div>

      <Footer />
    </>
  );
}

export default AdminDashboard;
