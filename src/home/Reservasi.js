import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Styles/Reservasi.css';
import { v4 as uuidv4 } from 'uuid';
import { generateStruk } from '../Utils/generateStruk';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function Reservasi() {
  const [mejaList, setMejaList] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMeja, setSelectedMeja] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [statusDihitung, setStatusDihitung] = useState('');
  const [loadingAfterPayment, setLoadingAfterPayment] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showFinishedPopup, setShowFinishedPopup] = useState(false);

  const userEmail = localStorage.getItem('email') || '';

  const [formData, setFormData] = useState({
    nama: '',
    email: userEmail,
    tanggal: '',
    waktu: '',
    jumlahOrang: '',
    catatan: '',
    setujuKetentuan: false,
  });

  const fetchReservationDetails = async () => {
    const email = localStorage.getItem('email');
    if (email) {
      try {
        const res = await fetch(`https://taichan69-backend.vercel.app/api/reservasi/by-email/${email}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Gagal mengambil detail reservasi');
        const data = await res.json();
        if (data && !data.error) {
          setReservationDetails(data);
          localStorage.setItem('reservationDetails', JSON.stringify(data));
          if (!localStorage.getItem('popupShown')) {
            setShowSuccessPopup(true);
            localStorage.setItem('popupShown', 'true');
          }
        }
      } catch (error) {
        console.error('❌ Gagal ambil detail reservasi:', error);
        setReservationDetails(null);
      }
    }
  };

  const fetchMejaList = async () => {
    try {
      const res = await fetch(`https://taichan69-backend.vercel.app/api/meja`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Gagal mengambil data meja');
      const data = await res.json();
      setMejaList(data);
    } catch (err) {
      console.error('Gagal ambil meja:', err);
    }
  };

  const fetchBookedSlots = async () => {
    if (formData.tanggal && selectedMeja) {
      try {
        const res = await fetch(`https://taichan69-backend.vercel.app/api/reservasi/cek-slot?tanggal=${formData.tanggal}&meja=${selectedMeja}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Gagal cek slot');
        const data = await res.json();
        setBookedSlots(data);
      } catch (err) {
        console.error('Gagal cek slot:', err);
        setBookedSlots([]);
      }
    }
  };

  useEffect(() => {
    fetchReservationDetails();
    fetchMejaList();
    const interval = setInterval(() => {
      fetchReservationDetails();
      fetchBookedSlots();
    }, 10000); // Polling setiap 10 detik
    return () => clearInterval(interval);
  }, [formData.tanggal, selectedMeja]);

  useEffect(() => {
    let timer;
    if (reservationDetails && reservationDetails.waktu) {
      const [jamMulai, menitMulai] = reservationDetails.waktu.split(' - ')[0].split(':').map(Number);
      const waktuMulai = new Date(reservationDetails.tanggalReservasi);
      waktuMulai.setHours(jamMulai, menitMulai, 0, 0);
      const waktuSelesai = new Date(waktuMulai.getTime() + 2 * 60 * 60 * 1000);

      timer = setInterval(() => {
        const now = new Date();

        const sisaWaktu = waktuSelesai - now;
        if (sisaWaktu <= 0) {
          setCountdown(null);
          setStatusDihitung('Selesai');
          if (!localStorage.getItem('popupFinishedShown')) {
            setShowFinishedPopup(true);
            localStorage.setItem('popupFinishedShown', 'true');
          }
          setReservationDetails(null);
          localStorage.removeItem('reservationDetails');
          clearInterval(timer);
          return;
        }

        setCountdown(Math.floor(sisaWaktu / 1000));

        if (now < waktuMulai) {
          setStatusDihitung('Belum Aktif');
        } else if (now >= waktuMulai && now < waktuSelesai) {
          setStatusDihitung('Aktif');
        } else {
          setStatusDihitung('Selesai');
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [reservationDetails]);

  const handlePilih = (nomorMeja) => {
    setSelectedMeja(nomorMeja);
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.setujuKetentuan) {
      alert('❌ Anda harus menyetujui biaya layanan reservasi.');
      return;
    }

    const uuid = uuidv4();
    const payload = {
      ...formData,
      meja: selectedMeja,
      uuid,
    };

    try {
      localStorage.removeItem('popupShown');
      localStorage.removeItem('popupFinishedShown');
      localStorage.setItem('pendingReservasi', JSON.stringify(payload));

      const res = await fetch(`https://taichan69-backend.vercel.app/api/reservasi/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalID: uuid,
          payerEmail: formData.email,
          description: 'Reservasi Meja',
          amount: 25000,
          successRedirectURL: `${window.location.origin}/reservasi?success=true&id=${uuid}`,
        }),
      });

      if (!res.ok) throw new Error('Gagal membuat invoice');
      const invoice = await res.json();
      window.location.href = invoice.invoice_url;
    } catch (err) {
      alert('❌ Gagal membuat invoice');
      console.error(err);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get('success');
    const uuid = params.get('id');

    const simpanReservasiSetelahBayar = async () => {
      const pending = JSON.parse(localStorage.getItem('pendingReservasi'));
      if (pending && isSuccess === 'true' && pending.uuid === uuid) {
        setLoadingAfterPayment(true);

        try {
          const res = await fetch(`https://taichan69-backend.vercel.app/api/reservasi/buat-reservasi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pending),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Gagal simpan reservasi');
          }

          const result = await res.json();
          setReservationDetails(result);
          localStorage.setItem('reservationDetails', JSON.stringify(result));
          if (!localStorage.getItem('popupShown')) {
            setShowSuccessPopup(true);
            localStorage.setItem('popupShown', 'true');
          }
          localStorage.removeItem('pendingReservasi');
          window.history.replaceState({}, '', '/reservasi');
        } catch (err) {
          console.error('Error:', err);
        } finally {
          setLoadingAfterPayment(false);
        }
      }
    };

    simpanReservasiSetelahBayar();
  }, []);

  return (
    <>
      <Navbar />
      <div className="reservasi-wrapper">
        {showSuccessPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h2>✅ Reservasi Berhasil!</h2>
              <p>Silahkan periksa detail reservasi dan unduh struk untuk ditunjukkan kepada pemilik warung.</p>
              <button onClick={() => setShowSuccessPopup(false)}>Tutup</button>
            </div>
          </div>
        )}

        {showFinishedPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h2>✅ Reservasi Selesai!</h2>
              <p>Terima-kasih telah berkunjung ke Sate Taichan 69!</p>
              <button onClick={() => setShowFinishedPopup(false)}>Tutup</button>
            </div>
          </div>
        )}

        {loadingAfterPayment ? (
          <div className="loading-box">
            <h3 style={{ color: '#e65100', textAlign: 'center' }}>✅ Pembayaran Berhasil!</h3>
            <p style={{ textAlign: 'center' }}>Mohon Tunggu...</p>
          </div>
        ) : reservationDetails ? (
          <div className="reservation-detail">
            {reservationDetails.gambarMeja && (
              <img
                src={reservationDetails.gambarMeja}
                alt={`Meja ${reservationDetails.meja}`}
                className="reservation-img"
              />
            )}

            <div className="reservation-info">
              <h2>Detail Reservasi Anda</h2>
              <p><strong>Nama Pemesan:</strong> {reservationDetails.nama}</p>
              <p><strong>No Reservasi:</strong> {reservationDetails.noReservasi}</p>
              <p><strong>Nomor Meja:</strong> {reservationDetails.meja}</p>
              <p><strong>Tanggal Reservasi:</strong> {new Date(reservationDetails.tanggalReservasi).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
              })}</p>
              <p><strong>Waktu:</strong> {reservationDetails.waktu}</p>
              <p><strong>Jumlah Orang:</strong> {reservationDetails.jumlahOrang}</p>
              <p><strong>Catatan:</strong> {reservationDetails.catatan || '-'}</p>
              <p><strong>Status:</strong> {statusDihitung || 'Menunggu'}</p>
              {countdown !== null && (
                <p><strong>Countdown sisa waktu reservasi:</strong> {formatTime(countdown)}</p>
              )}
              <button
                onClick={() => generateStruk(reservationDetails)}
                style={{
                  marginTop: 0,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#e65100',
                  color: 'white'
                }}
              >
                📄 Download Struk
              </button>
              <p className="status-note">
                <em>*Status akan diperbarui secara otomatis menjadi <strong>Aktif</strong> ketika waktu reservasi Anda dimulai sesuai jadwal.</em>
              </p>
            </div>
          </div>
        ) : (
          <div className="reservasi-page">
            <h2 className="reservasi-title">Reservasi Meja</h2>
            <div className="reservasi-list">
              {mejaList.map((meja) => (
                <div key={meja._id} className="reservasi-card">
                  <img
                    src={meja.gambar || 'https://via.placeholder.com/150'}
                    alt={`Meja ${meja.nomor}`}
                  />
                  <h4>Meja {meja.nomor}</h4>
                  <p>Kapasitas: {meja.kapasitas} orang</p>
                  <button className="reservasi-btn" onClick={() => handlePilih(meja.nomor)}>
                    Pilih Meja
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {formOpen && !reservationDetails && (
          <div className="form-popup" onClick={() => setFormOpen(false)}>
            <form className="form-box" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
              <h3>Reservasi Meja {selectedMeja}</h3>

              <input
                type="text"
                placeholder="Nama Pemesan"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />

              <input
                type="email"
                value={formData.email}
                readOnly
                disabled
              />

              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => {
                  setFormData({ ...formData, tanggal: e.target.value, waktu: '' });
                  setBookedSlots([]);
                }}
                required
              />

              <div className="grid-waktu">
                {['13:00 - 15:00', '15:00 - 17:00', '17:00 - 19:00', '19:00 - 21:00'].map((waktu) => {
                  const isBooked = bookedSlots.includes(waktu);
                  return (
                    <label
                      key={waktu}
                      className={`btn-waktu ${formData.waktu === waktu ? 'selected' : ''} ${isBooked ? 'disabled' : ''}`}
                      style={{
                        opacity: isBooked ? 0.3 : 1,
                        pointerEvents: isBooked ? 'none' : 'auto',
                        cursor: isBooked ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="waktu"
                        value={waktu}
                        checked={formData.waktu === waktu}
                        onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                        hidden
                        required
                        disabled={isBooked}
                      />
                      {waktu} {isBooked && <span style={{ color: 'red', fontSize: '12px' }}>(Tidak Tersedia)</span>}
                    </label>
                  );
                })}
              </div>

              <input
                type="number"
                placeholder="Jumlah Orang"
                value={formData.jumlahOrang}
                onChange={(e) => setFormData({ ...formData, jumlahOrang: e.target.value })}
                required
                min="1"
              />

              <textarea
                placeholder="Catatan Tambahan"
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              />

              <div className="deposit-info-box">
                <h5>📌 Informasi Biaya Reservasi</h5>
                <p>
                  Setiap reservasi dikenakan <strong>biaya layanan sebesar Rp25.000</strong>.
                  Biaya ini berlaku sebagai bentuk kompensasi atas pemrosesan dan penyediaan meja,
                  dan <strong>tidak dikembalikan</strong> dalam kondisi apa pun, termasuk jika pelanggan hadir.
                </p>
              </div>

              <div className="checkbox-ketentuan">
                <input
                  type="checkbox"
                  id="persetujuan"
                  checked={formData.setujuKetentuan}
                  onChange={(e) =>
                    setFormData({ ...formData, setujuKetentuan: e.target.checked })
                  }
                  required
                />
                <label htmlFor="persetujuan">
                  Saya menyetujui biaya layanan reservasi sebesar Rp25.000<br />
                  dan ketentuan yang berlaku.
                </label>
              </div>

              <div className="form-actions">
                <button type="submit">Pesan</button>
                <button type="button" onClick={() => setFormOpen(false)}>Batal</button>
              </div>
            </form>
          </div>
        )}
        <Footer />
      </div>
    </>
  );
}

export default Reservasi;