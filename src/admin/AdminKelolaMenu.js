import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Styles/AdminKelolaMenu.css';

function MenuCard({ item, onEdit, onDelete }) {
  return (
    <div className="card">
      <img
        src={item.gambar || 'https://via.placeholder.com/150?text=No+Image'}
        alt={item.nama}
        onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=No+Image')}
      />
      <div className="card-details">
        <h3>{item.nama}</h3>
        <p>Rp {parseInt(item.harga).toLocaleString('id-ID')}</p>
        <div className="order-controls">
          <button className="quantity-btn" onClick={() => onEdit(item)}>✏️</button>
          <button className="quantity-btn" onClick={() => onDelete(item._id)}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

function MenuForm({
  form,
  preview,
  error,
  editingId,
  onInput,
  onSubmit,
  onClose
}) {
  return (
    <div className="popup-form-wrapper">
      <form className="admin-menu-form" onSubmit={onSubmit}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
          {editingId ? 'Edit Menu' : 'Form Tambah Menu'}
        </h3>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Nama Menu</label>
          <input name="nama" value={form.nama} onChange={onInput} required />
        </div>

        <div className="form-group">
          <label>Harga</label>
          <input
            name="harga"
            type="number"
            value={form.harga}
            onChange={onInput}
            required
            min="1"
          />
        </div>

        <div className="form-group">
          <label>Kategori</label>
          <select name="kategori" value={form.kategori} onChange={onInput}>
            <option value="makanan">Makanan</option>
            <option value="minuman">Minuman</option>
          </select>
        </div>

        <div className="form-group">
          <label>Deskripsi</label>
          <textarea
            name="deskripsi"
            value={form.deskripsi}
            onChange={onInput}
            rows="3"
            placeholder="Contoh: Pedas gurih dengan sambal jeruk nipis"
          />
        </div>

        <div className="form-group">
          <label>Gambar</label>
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={onInput}
          />
        </div>

        {preview && <img src={preview} className="menu-image-preview" alt="Preview" />}

        <div className="form-buttons">
          <button type="submit">{editingId ? 'Update' : 'Tambah'} Menu</button>
          <button type="button" onClick={onClose}>Batal</button>
        </div>
      </form>
    </div>
  );
}

function AdminKelolaMenu() {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState({
    nama: '',
    harga: '',
    kategori: 'makanan',
    deskripsi: '',
    file: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const API_URL = 'http://70.153.136.221:5000/menu';

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Gagal mengambil data menu');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Format data menu tidak valid');
      setMenu(data);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError(err.message || 'Gagal memuat menu. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleInput = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      const file = files[0];
      if (file && !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setError('Hanya file JPG atau PNG yang diizinkan');
        return;
      }
      setForm((f) => ({ ...f, file }));
      setPreview(file ? URL.createObjectURL(file) : null);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.nama || !form.harga || !form.kategori) {
      setError('Nama, harga, dan kategori wajib diisi');
      return;
    }
    const hargaNum = parseFloat(form.harga);
    if (isNaN(hargaNum) || hargaNum <= 0) {
      setError('Harga harus berupa angka positif');
      return;
    }

    const formData = new FormData();
    formData.append('nama', form.nama);
    formData.append('harga', form.harga);
    formData.append('kategori', form.kategori);
    formData.append('deskripsi', form.deskripsi);
    if (form.file) formData.append('gambar', form.file);

    // ✅ Tambahkan ID unik hanya saat tambah menu (bukan edit)
    if (!editingId) {
      const generatedId = 'menu-' + Date.now();
      formData.append('id', generatedId);
    }

    const endpoint = editingId ? `${API_URL}/${editingId}` : API_URL;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const responseData = await res.json();
      if (res.ok) {
        alert(editingId ? '✅ Menu diperbarui' : '✅ Menu ditambahkan');
        closeForm();
        fetchMenu();
      } else {
        throw new Error(responseData.error || 'Gagal simpan menu');
      }
    } catch (err) {
      console.error('Error submitting menu:', err);
      setError(err.message || 'Gagal menyimpan menu. Silakan coba lagi.');
    }
  };

  const handleEdit = (m) => {
    setForm({
      nama: m.nama,
      harga: m.harga.toString(),
      kategori: m.kategori,
      deskripsi: m.deskripsi || '',
      file: null,
    });
    setEditingId(m._id);
    setPreview(m.gambar || null);
    openForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus menu ini?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const responseData = await res.json();
      if (res.ok) {
        alert('🗑️ Menu dihapus');
        fetchMenu();
      } else {
        throw new Error(responseData.error || 'Gagal hapus menu');
      }
    } catch (err) {
      console.error('Error deleting menu:', err);
      setError(err.message || 'Gagal menghapus menu. Silakan coba lagi.');
    }
  };

  const resetForm = () => {
    setForm({ nama: '', harga: '', kategori: 'makanan', deskripsi: '', file: null });
    setEditingId(null);
    setPreview(null);
    setError(null);
    if (formRef.current) {
      const fileInput = formRef.current.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    }
  };

  const openForm = () => {
    setFormVisible(true);
    setTimeout(() => {
      setShowForm(true);
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 10);
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
        <h2>Kelola Menu</h2>
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading">Memuat menu...</div>}

        <div className="card-container">
          <div className="card card-add" onClick={openForm}>
            <div className="card-add-content">
              <span>➕</span>
              <p>Tambah Menu</p>
            </div>
          </div>

          {menu.map((item) => (
            <MenuCard
              key={item._id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {formVisible && (
        <div className={`form-overlay ${showForm ? 'show' : ''}`} ref={formRef}>
          <MenuForm
            form={form}
            preview={preview}
            error={error}
            editingId={editingId}
            onInput={handleInput}
            onSubmit={handleSubmit}
            onClose={closeForm}
          />
        </div>
      )}
      <Footer />
    </>
  );
}

export default AdminKelolaMenu;
