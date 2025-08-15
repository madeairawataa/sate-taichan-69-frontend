import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Login.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert('Password berhasil diubah. Silakan login kembali.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <form
        className="login-form"
        onSubmit={
          step === 1
            ? handleRequestOTP
            : step === 2
            ? handleVerifyOTP
            : handleResetPassword
        }
      >
        <h2>Lupa Password</h2>

        {step === 1 && (
          <>
            <label>Email</label>
            <input
              type="email"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Mengirim OTP...' : 'Kirim OTP'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <label>Kode OTP</label>
            <input
              type="text"
              placeholder="Masukkan Kode OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <label>Password Baru</label>
            <input
              type="password"
              placeholder="Masukkan password baru"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />

            <label>Konfirmasi Password</label>
            <input
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Mengubah Password...' : 'Ubah Password'}
            </button>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/login')}
        >
          Kembali ke Login
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
