// src/components/FeedbackPopup.jsx
import React, { useState } from 'react';
import '../Styles/FeedbackPopup.css';

function FeedbackPopup({ pesanan, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [komentar, setKomentar] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Silakan pilih rating!');
      return;
    }
    onSubmit({
      pesananId: pesanan._id,
      namaPemesan: pesanan.nama || 'Anonim', // fallback jika nama tidak tersedia
      rating,
      komentar,
    });
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card feedback-card">
        <h3>PESANAN ANDA:</h3>
        <ul className="feedback-items">
          {pesanan.items.map((item, idx) => (
            <li key={idx}>
              {item.nama} – {item.jumlah} porsi
            </li>
          ))}
        </ul>
        <h4>TELAH SELESAI!</h4>
        <p>Selamat menikmati!</p>

        <div className="rating-section">
          <p>Beri Rating:</p>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${rating >= star ? 'filled' : ''}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          placeholder="Tulis komentar kamu..."
          value={komentar}
          onChange={(e) => setKomentar(e.target.value)}
        />

        <div className="feedback-buttons">
          <button onClick={handleSubmit}>Kirim</button>
          <button className="popup-close-btn" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackPopup;
