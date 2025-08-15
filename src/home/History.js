import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Tambahkan useNavigate
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Styles/History.css';

function History() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate(); // Inisialisasi useNavigate

  useEffect(() => {
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User belum login.');

      const res = await fetch('/api/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Gagal mengambil riwayat pesanan');

      const data = await res.json();
      setOrders(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchHistory();
}, []);


  const formatTanggal = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatWaktu = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Diproses':
        return 'status-diproses';
      case 'Selesai':
        return 'status-selesai';
      case 'Dibatalkan':
        return 'status-dibatalkan';
      case 'Siap Diantar':
        return 'status-siap';
      default:
        return 'status-menunggu';
    }
  };

  const handleFetchDetail = async (orderId) => {
    try {
      const res = await fetch(`/api/pesanan/${orderId}`);
      if (!res.ok) throw new Error('Gagal mengambil detail pesanan');

      const data = await res.json();
      setSelectedOrder(data);
    } catch (err) {
      console.error('❌ Error fetch detail:', err);
      alert('Gagal ambil detail pesanan');
    }
  };

  const handleLacak = (orderId) => {
    // Arahkan ke halaman StatusPesanan dengan orderId sebagai parameter
    navigate(`/status?orderId=${orderId}`);
  };

  return (
    <>
      <Navbar />
      <div className="history-page">
        <h2>Riwayat Pemesanan</h2>
        {loading && <p className="loading-message">Memuat riwayat pesanan...</p>}
        {error && <div className="error-message">{error}</div>}
        {!loading && orders.length === 0 && (
          <p className="loading-message">Belum ada riwayat pesanan.</p>
        )}

        <div className="history-list">
          {orders.map((order) => (
            <div className="history-card" key={order._id}>
              <h4>Pemesanan Makanan</h4>
              <p>Tanggal: {formatTanggal(order.createdAt)}</p>
              <p>
                Status:{' '}
                <strong className={getStatusClass(order.status)}>{order.status}</strong>
              </p>
              <button className="btn-deskripsi" onClick={() => handleFetchDetail(order._id)}>
                Detail
              </button>
              <button className="btn-lacak" onClick={() => handleLacak(order._id)}>
                Lacak
              </button>
            </div>
          ))}
        </div>

        {selectedOrder && (
          <div className="popup-history-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="popup-history-box" onClick={(e) => e.stopPropagation()}>
              <h3>Detail Pemesanan</h3>
              
              <p><strong>Nama Pemesan:</strong> {selectedOrder.namaPemesan}</p>
              <p><strong>Nomor Meja:</strong> {selectedOrder.nomorMeja || '-'}</p>
              <p><strong>Tanggal:</strong> {formatTanggal(selectedOrder.createdAt)}</p>
              <p><strong>Waktu:</strong> {formatWaktu(selectedOrder.createdAt)}</p>
              <p><strong>Catatan:</strong> {selectedOrder.catatan || 'Tidak ada catatan'}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`status-state ${getStatusClass(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </p>

              <div className="total-section">
                <p>Total Harga: Rp {selectedOrder.totalHarga?.toLocaleString('id-ID')}</p>
              </div>

              <div className="menu-section">
                <strong>Menu yang Dipesan:</strong>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="item-row-history">
                    <img
                      src={
                        item.gambar?.startsWith('http')
                          ? item.gambar
                          : `/api/${item.gambar || '/images/no-image.png'}`
                      }
                      alt={item.nama}
                      className="item-thumbnail-history"
                      onError={(e) => {
                        e.target.src = '/images/no-image.png';
                      }}
                    />
                    <div className="item-info">
                      <p>{item.nama} x {item.jumlah}</p>
                      <p>Rp {(item.harga * item.jumlah).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="feedback-section">
                <p><strong>Rating:</strong> {selectedOrder.feedback?.rating || 0} / 5</p>
                <p><strong>Komentar:</strong> {selectedOrder.feedback?.komentar || 'Belum ada komentar'}</p>
              </div>

              <button onClick={() => setSelectedOrder(null)}>Tutup</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default History;