import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // ⬅️ loading state
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // mulai loading

    if (formData.password !== formData.confirmPassword) {
      setIsLoading(false);
      return setError('Password dan konfirmasi tidak cocok');
    }

    try {
      const res = await fetch('taichan69-backend.vercel.app/auth/register-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setStep(2);
    } catch (err) {
      setError(err.message);
    }

    setIsLoading(false); // selesai loading
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // mulai loading

    try {
      const res = await fetch('taichan69-backend.vercel.app/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert('Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }

    setIsLoading(false); // selesai loading
  };

  return (
    <div className="login-wrapper">
      <form className="login-form" onSubmit={step === 1 ? handleRegisterRequest : handleVerifyOTP}>
        <h2>{step === 1 ? 'Daftar' : 'Verifikasi OTP'}</h2>
        {step === 2 && <p style={{ color: '#555', fontSize: '14px', marginBottom: '20px' }}>Silakan periksa kode OTP pada e-mail yang digunakan untuk mendaftar.</p>}
        {step === 1 ? (
          <>
            <label>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Masukkan username" required />

            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Masukkan email" required />

            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Masukkan password" required />

            <label>Konfirmasi Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Ulangi password" required />
          </>
        ) : (
          <>
            <label>Kode OTP</label>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Masukkan kode OTP dari email" required />
          </>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Mohon tunggu sebentar...' : step === 1 ? 'Daftar' : 'Verifikasi & Daftar'}
        </button>

        {error && <p className="error">{error}</p>}

        <button type="button" className="back-button" onClick={() => navigate('/')}>
          Kembali ke Home
        </button>

        {step === 1 && (
          <p>
            Sudah punya akun?{' '}
            <span className="link-register" onClick={() => navigate('/login')}>
              Login
            </span>
          </p>
        )}
      </form>
    </div>
  );
};

export default Register;
