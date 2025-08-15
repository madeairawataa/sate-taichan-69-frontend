import React, { useEffect, useRef, useState } from 'react';
import '../Styles/NotificationAudio.css';

function NotificationAudio() {
  const [enabled, setEnabled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const audioRef = useRef(new Audio('/sounds/notifadmin.mp3'));
  const prevNotifCount = useRef(0);

  const fetchNotifikasi = async () => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') return;

    try {
      const res = await fetch(`/api/notifikasi/admin`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Gagal mengambil notifikasi');
      const data = await res.json();
      const unread = data.filter((n) => !n.terbaca).length;
      if (unread > prevNotifCount.current && enabled) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.warn('Gagal play notifikasi:', err);
        });
      }
      prevNotifCount.current = unread;
    } catch (error) {
      console.error('❌ Gagal ambil notifikasi:', error);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('role');
    const soundAllowed = localStorage.getItem('adminSoundEnabled') === 'true';

    if (role === 'admin') {
      if (soundAllowed) {
        setEnabled(true);
      } else {
        setShowPopup(true);
      }
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchNotifikasi();
      const interval = setInterval(fetchNotifikasi, 10000); // Polling setiap 10 detik
      return () => clearInterval(interval);
    }
  }, [enabled]);

  const handleEnable = () => {
    localStorage.setItem('adminSoundEnabled', 'true');
    setEnabled(true);
    setShowPopup(false);
  };

  if (!enabled && !showPopup) return null;

  return (
    <>
      {showPopup && (
        <div className="permission-popup">
          <div className="popup-content">
            <p>Aktifkan suara notifikasi admin?</p>
            <button onClick={handleEnable}>Aktifkan</button>
          </div>
        </div>
      )}
      <audio ref={audioRef} src="/sounds/notifadmin.mp3" preload="auto" />
    </>
  );
}

export default NotificationAudio;