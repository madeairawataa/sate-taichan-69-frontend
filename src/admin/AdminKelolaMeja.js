import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Styles/AdminKelolaMenu.css';

function AdminKelolaMeja() {
  const [mejaList, setMejaList] = useState([]);
  const [form, setForm] = useState({
    nomor: '',
    kapasitas: '',
    file: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  const fetchMeja = async () => {
    try {
      const res = await fetch(`api/api/meja`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error('Gagal mengambil data meja');
      const data = await res.json();
      setMejaList(data);
    } catch (err) {
      console.error('Error fetching meja:', err);
      setError('Gagal memuat data meja. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    fetchMeja();
  }, []);

  const handleInput = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setForm((f) => ({ ...f, file: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.nomor || !form.kapasitas) {
      setError('Nomor dan kapasitas meja wajib diisi.');
      return;
    }

    if (parseInt(form.kapasitas) <= 0) {
      setError('Kapasitas harus lebih dari 0');
      return;
    }

    if (form.file && !['image/jpeg', 'image/png', 'image/jpg'].includes(form.file.type)) {
      setError('Gambar harus berformat JPG atau PNG');
      return;
    }

    if (form.file && form.file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('nomor', form.nomor);
    formData.append('kapasitas', parseInt(form.kapasitas));
    if (form.file) formData.append('gambar', form.file);

    try {
      const endpoint = editingId
        ? `/api/api/meja/${editingId}`
        : '/api/api/meja';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const responseData = await res.json();
      if (res.ok) {
        alert(editingId ? '✅ Meja diperbarui' : '✅ Meja ditambahkan');
        closeForm();
        fetchMeja();
      } else {
        throw new Error(responseData.error || 'Gagal menyimpan data meja');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Gagal menyimpan data meja. Silakan coba lagi.');
    }
  };

  const handleEdit = (meja) => {
    setForm({
      nomor: meja.nomor,
      kapasitas: meja.kapasitas.toString(),
      file: null,
    });
    setEditingId(meja._id);
    setError(null);
    openForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus meja ini?')) return;
    try {
      const res = await fetch(`/api/api/meja/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const responseData = await res.json();
      if (res.ok) {
        alert('🗑️ Meja dihapus');
        fetchMeja();
      } else {
        throw new Error(responseData.error || 'Gagal menghapus meja');
      }
    } catch (err) {
      console.error('Error deleting meja:', err);
      setError(err.message || 'Gagal menghapus meja. Silakan coba lagi.');
    }
  };

  const resetForm = () => {
    setForm({ nomor: '', kapasitas: '', file: null });
    setEditingId(null);
    setError(null);
  };

  const openForm = () => {
    setFormVisible(true);
    setTimeout(() => setShowForm(true), 10);
  };

  const closeForm = () => {
    setShowForm(false);
    setTimeout(() => {
      setFormVisible(false);
      resetForm();
    }, 300);
  };

  return (
    <>
      <Navbar />
      <div className={`menu-container ${formVisible ? 'blur-active' : ''}`}>
        <h2>Kelola Meja</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="card-container">
          <div className="card card-add" onClick={openForm}>
            <div className="card-add-content">
              <span>➕</span>
              <p>Tambah Meja</p>
            </div>
          </div>

          {mejaList.map((meja) => (
            <div key={meja._id} className="card">
              <img
                src={meja.gambar || 'https://via.placeholder.com/150'}
                alt={`Meja ${meja.nomor}`}
                className="menu-image"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150';
                }}
              />
              <div className="card-details">
                <h3>Meja #{meja.nomor}</h3>
                <p>Kapasitas: {meja.kapasitas} orang</p>
                <div className="order-controls">
                  <button className="quantity-btn" onClick={() => handleEdit(meja)}>
                    ✏️
                  </button>
                  <button className="quantity-btn" onClick={() => handleDelete(meja._id)}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {formVisible && (
        <div className={`form-overlay ${showForm ? 'show' : ''}`} ref={formRef}>
          <div className="popup-form-wrapper">
            <form className="admin-menu-form" onSubmit={handleSubmit}>
              <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
                {editingId ? 'Edit Meja' : 'Tambah Meja'}
              </h3>

              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label>Nomor Meja</label>
                <input
                  name="nomor"
                  value={form.nomor}
                  onChange={handleInput}
                  required
                  placeholder="Masukkan nomor meja"
                />
              </div>

              <div className="form-group">
                <label>Kapasitas (orang)</label>
                <input
                  name="kapasitas"
                  type="number"
                  min="1"
                  value={form.kapasitas}
                  onChange={handleInput}
                  required
                  placeholder="Masukkan jumlah kapasitas"
                />
              </div>

              <div className="form-group">
                <label>Gambar Meja (opsional, maks 5MB)</label>
                <input
                  type="file"
                  name="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleInput}
                />
              </div>

              <div className="form-buttons">
                <button type="submit">{editingId ? 'Update' : 'Tambah'} Meja</button>
                <button type="button" onClick={closeForm}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}

export default AdminKelolaMeja;
