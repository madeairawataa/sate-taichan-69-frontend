import React, { useEffect, useState } from 'react';
import '../Styles/AdminMenu.css';

function AdminMenu({ socket }) {
  const [pesanan, setPesanan] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [filter, setFilter] = useState('semua');

  const fetchPesanan = () => {
    fetch('http://localhost:5000/api/pesanan/admin', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const hasil = Array.isArray(data) ? data : data.data;
        setPesanan(hasil || []);
        const initialStatus = {};
        (hasil || []).forEach((p) => {
          initialStatus[p._id] = p.status;
        });
        setStatusMap(initialStatus);
      })
      .catch((err) => {
        console.error('❌ Gagal ambil data pesanan:', err);
        setPesanan([]);
      });
  };

  useEffect(() => {
    fetchPesanan();

    if (socket) {
      socket.on('updatePesanan', fetchPesanan);
      socket.on('notifikasi', (data) => {
        if (data.type === 'pesanan') {
          fetchPesanan();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('updatePesanan');
        socket.off('notifikasi');
      }
    };
  }, [socket]);

  const handleUpdate = async (id) => {
    const newStatus = statusMap[id];
    try {
      const res = await fetch(`http://localhost:5000/api/pesanan/${id}/status`, {
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

      if (socket) {
        socket.emit('updatePesanan');
      }
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
        : `http://localhost:5000${item.gambar}`
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
