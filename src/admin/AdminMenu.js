import React, { useState, useEffect } from 'react';
import '../Styles/AdminMenu.css';

function AdminMenu() {
  const [pesanan, setPesanan] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [filter, setFilter] = useState('semua');

  const fetchPesanan = async () => {
    try {
      const response = await fetch(`api/api/pesanan/admin`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Gagal mengambil data pesanan');
      }
      const data = await response.json();
      const hasil = Array.isArray(data) ? data : data.data;
      setPesanan(hasil || []);
      const initialStatus = {};
      (hasil || []).forEach((p) => {
        initialStatus[p._id] = p.status;
      });
      setStatusMap(initialStatus);
    } catch (err) {
      console.error('❌ Gagal ambil data pesanan:', err);
      setPesanan([]);
    }
  };

  useEffect(() => {
    fetchPesanan();
    const interval = setInterval(fetchPesanan, 10000); // Polling setiap 10 detik
    return () => clearInterval(interval); // Bersihkan interval saat unmount
  }, []);

  const handleUpdate = async (id) => {
    const newStatus = statusMap[id];
    try {
      const res = await fetch(`api//api/pesanan/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Gagal update status');
      const updated = await res.json();
      setPesanan((prev) =>
        prev.map((p) => (p._id === updated._id ? { ...p, status: updated.status } : p))
      );
    } catch (err) {
      alert('❌ Gagal mengupdate status');
    }
  };

  const filtered =
    filter === 'semua'
      ? pesanan
      : pesanan.filter((p) => p.status?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="admin-container">
      <h2>Daftar Pemesanan Menu</h2>

      <div className="admin-tabs small-tabs">
        {['semua', 'menunggu', 'diproses', 'siap diantar', 'selesai', 'dibatalkan'].map((s) => (
          <button
            key={s}
            className={filter === s ? 'active' : ''}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-grid">
        {filtered.length === 0 ? (
          <p className="no-data">Belum ada pesanan.</p>
        ) : (
          filtered.map((p) => (
            <div className="admin-card" key={p._id}>
              <div className="status-nama">{p.namaPemesan}</div>
              <div className="status-info">No Pesanan: {p.nomorPesanan || '-'}</div>
              <div className="status-info">Tipe: {p.tipePesanan}</div>
              {p.tipePesanan === 'Dine In' && (
                <div className="status-info">Meja: {p.nomorMeja}</div>
              )}
              <div className="status-info">
                Total: Rp {p.totalHarga.toLocaleString('id-ID')}
              </div>
              <div className="status-info">Catatan: {p.catatan || '-'}</div>
              <div className="status-info">
                Waktu: {new Date(p.createdAt).toLocaleString('id-ID')}
              </div>

              <div className="status-info">Pesanan:</div>
              <ul className="status-items">
                {p.items.map((item, i) => (
                  <li key={i} className="status-item">
                    <img
                      src={
                        item.gambar
                          ? item.gambar.startsWith('http')
                            ? item.gambar
                            : `${process.env.REACT_APP_BACKEND_URL}${item.gambar}`
                          : 'https://via.placeholder.com/50'
                      }
                      alt={item.nama}
                      className="status-item-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/50';
                      }}
                    />
                    <div className="status-item-detail">
                      <strong>{item.nama}</strong> x {item.jumlah}
                      <br />
                      (Rp {(item.harga * item.jumlah).toLocaleString('id-ID')})
                    </div>
                  </li>
                ))}
              </ul>

              <div className="admin-actions">
                <select
                  value={statusMap[p._id] || p.status}
                  onChange={(e) =>
                    setStatusMap((prev) => ({
                      ...prev,
                      [p._id]: e.target.value,
                    }))
                  }
                >
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Siap Diantar">Siap Diantar</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
                <button onClick={() => handleUpdate(p._id)}>Update</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminMenu;