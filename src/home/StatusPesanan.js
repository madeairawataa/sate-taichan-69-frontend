import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../Styles/StatusPesanan.css';
import FeedbackPopup from '../home/FeedbackPopup';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { generateStrukPesanan } from '../Utils/generateStruk';

function StatusPesanan() {
  const [pesanan, setPesanan] = useState([]);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [popupStatus, setPopupStatus] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedPesanan, setSelectedPesanan] = useState(null);

  const navigate = useNavigate();
  const audioNotif = useRef(new Audio('/sounds/notif.mp3'));
  const prevStatuses = useRef({});
  const location = useLocation();

  const fetchPesanan = async () => {
    try {
      const role = localStorage.getItem('role');
      const userId = localStorage.getItem('userId');
      const uuid = localStorage.getItem('userUUID');

      let url = `/api/api/pesanan`;
      const searchParams = new URLSearchParams(location.search);
      const orderId = searchParams.get('orderId');
      if (orderId) {
        url = `/api/pesanan/${orderId}`;
      } else if (userId) {
        url += `?userId=${userId}`;
      } else if (uuid) {
        url += `?uuid=${uuid}`;
      } else {
        setError('Tidak ada identitas pengguna');
        setIsReady(true);
        return;
      }

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }),
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Gagal fetch: ${res.status} - ${res.statusText}`);
      }
      const data = await res.json();

      if (orderId && data._id) {
        const newStatus = data.status;
        if (prevStatuses.current[data._id] && prevStatuses.current[data._id] !== newStatus) {
          audioNotif.current.play().catch((err) => console.warn('Audio gagal play:', err));
          setPopupStatus({
            nama: data.namaPemesan,
            status: newStatus,
            waktu: new Date().toLocaleTimeString('id-ID'),
          });

          if (newStatus === 'Dibatalkan') {
            setTimeout(() => navigate('/'), 3000);
          }

          if (newStatus === 'Selesai' && !localStorage.getItem(`feedback_${data._id}`)) {
            setSelectedPesanan(data);
            setShowFeedback(true);
          }
        }
        prevStatuses.current[data._id] = newStatus;
        setPesanan([data]);
        setError('');
      } else if (Array.isArray(data.data)) {
        const newStatuses = {};
        data.data.forEach((p) => {
          newStatuses[p._id] = p.status;
          if (prevStatuses.current[p._id] && prevStatuses.current[p._id] !== p.status) {
            audioNotif.current.play().catch((err) => console.warn('Audio gagal play:', err));
            setPopupStatus({
              nama: p.namaPemesan,
              status: p.status,
              waktu: new Date().toLocaleTimeString('id-ID'),
            });

            if (p.status === 'Dibatalkan') {
              setTimeout(() => navigate('/'), 3000);
            }

            if (p.status === 'Selesai' && !localStorage.getItem(`feedback_${p._id}`)) {
              setSelectedPesanan(p);
              setShowFeedback(true);
            }
          }
        });
        prevStatuses.current = newStatuses;
        setPesanan(data.data);
        setError('');
      } else {
        setError(data.error || 'Data tidak valid');
      }
    } catch (err) {
      console.error('❌ Error fetch:', err);
      setError(`Gagal mengambil data: ${err.message}`);
    } finally {
      setIsReady(true);
    }
  };

  const handleDownloadStruk = (pesananItem) => {
    try {
      generateStrukPesanan(pesananItem);
    } catch (error) {
      console.error('Error generating struk:', error);
      alert('Gagal membuat struk. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    const unlockAudio = () => {
      audioNotif.current.play().catch(() => {});
      audioNotif.current.pause();
      audioNotif.current.currentTime = 0;
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('orderId');

    if (userId && !orderId) {
      navigate('/history');
      return;
    }

    if (role === 'admin') {
      navigate('/');
      return;
    }

    if (userId) {
      localStorage.removeItem('userUUID');
      sessionStorage.removeItem('userUUID');
    } else {
      let uuid = localStorage.getItem('userUUID') || sessionStorage.getItem('userUUID');
      if (!uuid) {
        uuid = crypto.randomUUID();
        localStorage.setItem('userUUID', uuid);
        sessionStorage.setItem('userUUID', uuid);
      }
    }

    fetchPesanan();
    const interval = setInterval(fetchPesanan, 10000); // Polling setiap 10 detik
    return () => clearInterval(interval);
  }, [navigate, location.search]);

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

  const handleFeedbackSubmit = async (pesananItem, feedback) => {
    try {
      const res = await fetch(`/api/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }),
        },
        body: JSON.stringify({
          pesananId: pesananItem._id,
          namaPemesan: pesananItem.namaPemesan,
          rating: feedback.rating,
          komentar: feedback.komentar,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengirim feedback');
      }

      const role = localStorage.getItem('role');
      if (!role) {
        setPesanan((prev) => prev.filter((p) => p._id !== pesananItem._id));
        if (pesanan.length <= 1) navigate('/');
      } else {
        localStorage.setItem(`feedback_${pesananItem._id}`, 'done');
      }

      alert('Terima kasih atas feedback Anda!');
      setShowFeedback(false);
    } catch (err) {
      console.error('❌ Gagal kirim feedback:', err);
      alert('Gagal mengirim feedback: ' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }),
        },
      });
      if (!res.ok) throw new Error('Gagal logout');
    } catch (err) {
      console.error('Error logout:', err);
    }

    localStorage.clear();
    sessionStorage.clear();
    const newUuid = crypto.randomUUID();
    localStorage.setItem('userUUID', newUuid);
    sessionStorage.setItem('userUUID', newUuid);
    navigate('/login');
  };

  return (
    <>
      <Navbar onLogout={handleLogout} />
      {popupStatus && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>Status Pesanan Diperbarui</h3>
            <p><strong>{popupStatus.nama}</strong></p>
            <p><small>Waktu:</small><br /><small>{popupStatus.waktu}</small></p>
            <p>Status sekarang: <span className="popup-status">{popupStatus.status}</span></p>
            <button className="popup-close-btn" onClick={() => setPopupStatus(null)}>Tutup</button>
          </div>
        </div>
      )}

      {showFeedback && selectedPesanan && (
        <FeedbackPopup
          pesanan={selectedPesanan}
          onClose={() => setShowFeedback(false)}
          onSubmit={(feedbackData) => handleFeedbackSubmit(selectedPesanan, feedbackData)}
        />
      )}

      <div className="status-container">
        <h2 className="status-title">Status Pesanan Kamu</h2>

        {!isReady ? (
          <p style={{ textAlign: 'center', color: 'white' }}>Loading...</p>
        ) : error ? (
          <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>
        ) : (
          pesanan.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'white' }}>Belum ada pesanan.</p>
          ) : (
            <div className="status-grid">
              {pesanan.map((p) => (
                <div key={p._id} className="status-card">
                  <h3 className="status-nama">{p.namaPemesan}</h3>
                  <p className="status-info"><span className="status-label">No Pesanan:</span> {p.nomorPesanan}</p>
                  <p className="status-info"><span className="status-label">Tipe:</span> {p.tipePesanan}</p>
                  {p.tipePesanan === 'Dine In' && (
                    <p className="status-info"><span className="status-label">Meja:</span> {p.nomorMeja}</p>
                  )}
                  <p className="status-info"><span className="status-label">Total:</span> Rp {p.totalHarga.toLocaleString('id-ID')}</p>
                  <p className="status-info"><span className="status-label">Catatan:</span> {p.catatan || '-'}</p>
                  <p className="status-info"><span className="status-label">Waktu Pesan:</span>{' '}
                    {new Date(p.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="status-info"><span className="status-label">Pesanan:</span></p>
                  <ul className="status-items">
                    {p.items.map((item, idx) => (
                      <li key={idx} className="status-item">
                        <img
                          src={item.gambar?.startsWith('http') ? item.gambar : `/api/${item.gambar || '/images/no-image.png'}`}
                          alt={item.nama}
                          className="status-item-image"
                          onError={(e) => {
                            e.target.src = '/images/no-image.png';
                          }}
                        />
                        <div className="status-item-detail">
                          <strong>{item.nama}</strong> – {item.jumlah} porsi
                          <br />
                          (Rp {(item.harga * item.jumlah).toLocaleString('id-ID')})
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="status-actions">
                    <p className={`status-state ${getStatusClass(p.status)}`}>
                      Status: {p.status || 'Menunggu'}
                    </p>
                    <button 
                      className="struk-btn" 
                      onClick={() => handleDownloadStruk(p)}
                      title="Download Struk Pesanan"
                    >
                      📄 Download Struk
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      <Footer />
    </>
  );
}

export default StatusPesanan;