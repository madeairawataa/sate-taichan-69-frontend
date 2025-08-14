// src/admin/AdminReservasi.js
import React, { useEffect, useState } from 'react';
import '../Styles/AdminReservasi.css';

function AdminReservasi({ socket, setTab }) {
  const [reservasi, setReservasi] = useState([]);
  const [filter, setFilter] = useState('semua');

  const statusList = ['semua', 'belum aktif', 'aktif', 'selesai'];

  const fetchData = () => {
    fetch('taichan69-backend.vercel.app/api/reservasi')
      .then((res) => res.json())
      .then((data) => {
        const hasil = Array.isArray(data) ? data : data.data;
        setReservasi(hasil || []);
      })
      .catch(() => setReservasi([]));
  };

  useEffect(() => {
    fetchData();
    socket.on('updateReservasi', fetchData);
    return () => {
      socket.off('updateReservasi', fetchData);
    };
  }, [socket]);

  const filtered =
    filter === 'semua'
      ? reservasi
      : reservasi.filter((r) => r.status?.toLowerCase() === filter);

  return (
    <div className="admin-container">
      <h2>Daftar Reservasi Meja</h2>

      <div className="admin-tabs small-tabs">
        {statusList.map((s) => (
          <button
            key={s}
            className={filter === s ? 'active' : ''}
            onClick={() => setFilter(s)}
          >
            {s === 'semua' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-grid">
        {filtered.length === 0 ? (
          <p className="no-data">Belum ada reservasi.</p>
        ) : (
          filtered.map((r) => (
            <div className="admin-card" key={r._id}>
              <div className="status-nama"><strong>{r.nama}</strong></div>
              <div className="status-info">Meja: {r.meja}</div>
              <div className="status-info">Tanggal: {new Date(r.tanggalReservasi).toLocaleDateString()}</div>
              <div className="status-info">Waktu: {r.waktu}</div>
              <div className="status-info">Jumlah Orang: {r.jumlahOrang}</div>
              <div className="status-info">Catatan: {r.catatan || '-'}</div>
              <div
                className={`status-state status-${r.status
                  ?.toLowerCase()
                  .replace(/\s+/g, '-')}`}
              >
                Status: {r.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminReservasi;
