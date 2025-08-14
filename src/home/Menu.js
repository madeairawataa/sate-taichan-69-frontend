import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Styles/Menu.css';
import io from 'socket.io-client';

const socket = io('taichan69-backend.vercel.app', {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const defaultImage = '/images/default.jpg';

function Menu() {
  const [makanan, setMakanan] = useState([]);
  const [pesanan, setPesanan] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    namaPemesan: '',
    nomorMeja: '',
    catatan: '',
    tipePesanan: 'Dine In',
  });
  const [deskripsiPopup, setDeskripsiPopup] = useState(null);
  const [error, setError] = useState(null);
  const [kategoriAktif, setKategoriAktif] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const nomorPesanan = `ORD-${Date.now()}`;


  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('taichan69-backend.vercel.app/menu');
        if (!res.ok) throw new Error('Gagal mengambil data menu');
        const data = await res.json();

        const init = {};
        data.forEach((item) => {
          if (item && item._id) {
            init[item._id] = 0;
          }
        });

        setMakanan(data);
        setPesanan(init);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Gagal memuat menu. Silakan coba lagi.');
      }
    };
    fetchMenu();

    return () => {
      socket.off('updatePesanan');
    };
  }, []);

  const handleFilterKategori = (kategori) => {
    setKategoriAktif(kategori);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredMakanan = makanan
    .filter((item) => {
      const cocokKategori =
        kategoriAktif === 'Semua' || (item.kategori && item.kategori.toLowerCase() === kategoriAktif.toLowerCase());
      const cocokSearch =
        item.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase());
      return cocokKategori && cocokSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const isValidImageUrl = (url) => typeof url === 'string' && url.startsWith('http');
  const tambahPesanan = (id) => setPesanan((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const kurangPesanan = (id) => setPesanan((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'tipePesanan' && value === 'Take Away' ? { nomorMeja: '' } : {}),
    }));
  };

  const totalItem = Object.values(pesanan).reduce((sum, val) => sum + (val || 0), 0);
  const totalHarga = makanan.reduce((sum, item) => sum + (pesanan[item._id] || 0) * (item.harga || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    if (!formData.namaPemesan) {
      setError('Nama pemesan wajib diisi');
      submitButton.disabled = false;
      return;
    }
    if (formData.tipePesanan === 'Dine In' && !formData.nomorMeja) {
      setError('Nomor meja wajib dipilih untuk Dine In');
      submitButton.disabled = false;
      return;
    }

    const userId = localStorage.getItem('userId');
    const uuid = localStorage.getItem('userUUID') || crypto.randomUUID();
    if (!userId) localStorage.setItem('userUUID', uuid);

    const items = makanan
      .filter((item) => (pesanan[item._id] || 0) > 0)
      .map((item) => ({
        id: item._id,
        nama: item.nama || 'Unknown',
        jumlah: pesanan[item._id] || 0,
        harga: item.harga || 0,
      }));

    const payload = {
      userId: userId || null,
      uuid: userId ? null : uuid,
      nomorPesanan,
      nama: formData.namaPemesan,
      nomorMeja: formData.nomorMeja,
      catatan: formData.catatan,
      total: totalHarga,
      tipe: 'menu',
      tipePesanan: formData.tipePesanan,
      detail: items,
    };

    try {
      console.log('Mengirim payload ke /buat-invoice:', payload);
      const res = await fetch('taichan69-backend.vercel.app/api/pembayaran/buat-invoice', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
      } else {
        throw new Error(data.error || 'Gagal membuat invoice.');
      }
    } catch (err) {
      setError(err.message || 'Gagal menghubungkan ke server.');
    } finally {
      submitButton.disabled = false;
    }
  };

  return (
    <>
      <div className={`menu-wrapper ${showForm ? 'blurred' : ''}`}>
        <Navbar />
        <div className="menu-page">
          <h2>Daftar Menu</h2>

          <div className="menu-toolbar">
            <div className="search-container">
              <input
                type="text"
                className="search-box"
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="filter-buttons">
              {['Semua', 'Makanan', 'Minuman'].map((kategori) => (
                <button
                  key={kategori}
                  className={`filter-btn ${kategoriAktif === kategori ? 'active' : ''}`}
                  onClick={() => handleFilterKategori(kategori)}
                >
                  {kategori}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          <div className="menu-list">
            {filteredMakanan.length > 0 ? (
              filteredMakanan.map((item) => (
                <div key={item._id} className="menu-card">
                  <img
                    src={isValidImageUrl(item.gambar) ? item.gambar : defaultImage}
                    alt={item.nama || 'No name'}
                    onError={(e) => (e.target.src = defaultImage)}
                  />
                  <h4>{item.nama || 'No name'}</h4>
                  <p>Rp {item.harga?.toLocaleString('id-ID') || '0'}</p>
                  <button className="btn-deskripsi" onClick={() => setDeskripsiPopup(item)}>
                    Deskripsi
                  </button>
                  <div className="menu-actions">
                    <button onClick={() => kurangPesanan(item._id)} disabled={pesanan[item._id] === 0}>
                      −
                    </button>
                    <span>{pesanan[item._id] || 0}</span>
                    <button onClick={() => tambahPesanan(item._id)}>+</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="menu-empty-message">Tidak ada menu tersedia</p>
            )}
          </div>
        </div>
        <Footer />
      </div>

      {totalItem > 0 && (
        <div className="pesanan-footer">
          <span>{totalItem} item</span>
          <button onClick={() => setShowForm(true)}>Pesan</button>
        </div>
      )}

      {showForm && (
        <div className="form-popup" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="form-box" onClick={(e) => e.stopPropagation()}>
            <h3>Form Pemesanan</h3>
            {error && <div className="error-message">{error}</div>}
            <label className="form-label">Nama Pemesan</label>
            <input
              type="text"
              name="namaPemesan"
              value={formData.namaPemesan}
              onChange={handleFormChange}
              placeholder="Masukkan nama pemesan.."
              required
            />
            <label className="form-label">Jenis Layanan</label>
            <div className="radio">
              <label>
                <input
                  type="radio"
                  name="tipePesanan"
                  value="Dine In"
                  checked={formData.tipePesanan === 'Dine In'}
                  onChange={handleFormChange}
                />
                Dine In
              </label>
              <label>
                <input
                  type="radio"
                  name="tipePesanan"
                  value="Take Away"
                  checked={formData.tipePesanan === 'Take Away'}
                  onChange={handleFormChange}
                />
                Take Away
              </label>
            </div>
            {formData.tipePesanan === 'Dine In' && (
              <>
                <label className="form-label">Nomor Meja</label>
                <div className="grid-meja">
                  {[1, 2, 3, 4, 5, 6, 7].map((meja) => (
                    <button
                      type="button"
                      key={meja}
                      className={`btn-meja ${formData.nomorMeja === String(meja) ? 'selected' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, nomorMeja: String(meja) }))}
                    >
                      Meja {meja}
                    </button>
                  ))}
                </div>
              </>
            )}
            <label className="form-label">Catatan</label>
            <textarea
              name="catatan"
              value={formData.catatan}
              onChange={handleFormChange}
              placeholder="Masukkan catatan (opsional).."
            ></textarea>

            <div className="form-item-list">
              {makanan
                .filter((item) => (pesanan[item._id] || 0) > 0)
                .map((item) => (
                  <div key={item._id} className="form-item">
                    <img
                      src={isValidImageUrl(item.gambar) ? item.gambar : defaultImage}
                      alt={item.nama}
                      onError={(e) => (e.target.src = defaultImage)}
                    />
                    <div>
                      <div>{item.nama}</div>
                      <div>Jumlah: {pesanan[item._id]}</div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="form-total-pesanan">
              <span>Total Item: {totalItem}</span>
              <span>Total Harga: Rp {totalHarga.toLocaleString('id-ID')}</span>
            </div>
            <div className="form-actions">
              <button type="submit">Pesan</button>
              <button type="button" onClick={() => setShowForm(false)}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {deskripsiPopup && (
        <div className="popup-deskripsi-overlay" onClick={() => setDeskripsiPopup(null)}>
          <div className="popup-deskripsi-box" onClick={(e) => e.stopPropagation()}>
            <img
              src={isValidImageUrl(deskripsiPopup.gambar) ? deskripsiPopup.gambar : defaultImage}
              alt={deskripsiPopup.nama}
              onError={(e) => (e.target.src = defaultImage)}
            />
            <h3>{deskripsiPopup.nama}</h3>
            <p className="popup-harga">Rp {deskripsiPopup.harga?.toLocaleString('id-ID')}</p>
            <p className="popup-deskripsi">{deskripsiPopup.deskripsi || 'Tidak ada deskripsi.'}</p>
            <button onClick={() => setDeskripsiPopup(null)} className="btn-tutup-deskripsi">
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Menu;