// src/components/NotificationAudio.js
import React, { useEffect, useRef, useState } from 'react';
import '../Styles/NotificationAudio.css';
import { io } from 'socket.io-client';

const socket = io('taichan69-backend.vercel.app');

function NotificationAudio() {
  const [enabled, setEnabled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    const soundAllowed = localStorage.getItem('adminSoundEnabled') === 'true';

    if (role === 'admin') {
      if (soundAllowed) {
        setEnabled(true);
      } else {
        setShowPopup(true); // Tampilkan konfirmasi
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const playSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.warn('Gagal play notifikasi:', err);
        });
      }
    };

    socket.on('notifikasi', playSound);
    return () => socket.off('notifikasi', playSound);
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
