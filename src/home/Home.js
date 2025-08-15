import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Styles/Home.css';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation, Autoplay } from 'swiper/modules';

import slide1 from '../assets/slide1.jpg';
import slide2 from '../assets/slide2.jpg';
import slide3 from '../assets/slide3.jpg';
import slide4 from '../assets/slide4.jpg';

import gallery1 from '../assets/gallery1.png';
import gallery2 from '../assets/gallery2.png';
import gallery3 from '../assets/gallery3.png';
import gallery4 from '../assets/gallery4.png';
import gallery5 from '../assets/gallery5.png';
import gallery6 from '../assets/gallery6.png';

function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const aboutRef = useRef(null);
  const reservationRef = useRef(null);

  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showLoginNotif, setShowLoginNotif] = useState(false);
  const [galleryCaptions, setGalleryCaptions] = useState([]);

  // 🔄 Ambil feedback dari backend
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await axios.get('/api/feedback');
        const formatted = res.data.map(item => ({
          text: item.komentar || `Rating: ${item.rating}`,
          name: item.namaPemesan || 'Anonim',
          rating: item.rating || 0

        }));
        setGalleryCaptions(formatted);
      } catch (err) {
        console.error('Gagal ambil feedback:', err);
        // fallback dummy
        setGalleryCaptions([
          { text: 'Arak Ginsengnya Mantap!', name: 'Budi' },
          { text: 'Teman Nongkrong Sore Di Pantai Mertasari', name: 'Sinta' },
        ]);
      }
    };

    fetchFeedback();
  }, []);

  // ⏱️ Putar caption otomatis
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentCaptionIndex((prev) => (prev + 1) % galleryCaptions.length);
        setFade(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [galleryCaptions]);

  // 🔐 Redirect admin
  useEffect(() => {
    if (token && role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [token, role, navigate]);

  // 📸 Animasi scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
          else entry.target.classList.remove('is-visible');
        });
      },
      { threshold: 0.3 }
    );

    if (aboutRef.current) observer.observe(aboutRef.current);
    if (reservationRef.current) observer.observe(reservationRef.current);

    return () => {
      if (aboutRef.current) observer.unobserve(aboutRef.current);
      if (reservationRef.current) observer.unobserve(reservationRef.current);
    };
  }, []);

  const handlePesanMenuClick = () => navigate('/menu');
  const handleReservationClick = () => {
    if (!token) setShowLoginNotif(true);
    else navigate('/reservasi');
  };

  return (
    <>
      <Navbar />

      {/* 🔁 Carousel Utama */}
      <div className="carousel-wrapper">
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation
          autoplay={{ delay: 3000 }}
          loop
          className="carousel-container"
        >
          <SwiperSlide><img src={slide1} alt="Slide 1" className="carousel-image" /></SwiperSlide>
          <SwiperSlide><img src={slide3} alt="Slide 3" className="carousel-image" /></SwiperSlide>
          <SwiperSlide><img src={slide4} alt="Slide 4" className="carousel-image" /></SwiperSlide>
        </Swiper>

        <div className="carousel-text">
          <h1>SATE TAICHAN 69</h1>
          <p>Satay And Cold Beer</p>
          <button className="order-button-home menu-button" onClick={handlePesanMenuClick}>
            PESAN MENU
          </button>
        </div>
      </div>

     {/* Tentang Kami */}
      <section id="about" className="about-fullscreen">
        <img src={slide2} alt="Foto Restoran" className="about-fullscreen-image" />
        <div className="about-overlay fade-in-section" ref={aboutRef}>
          <h2>Tentang Kami</h2>
          <p>
            Sate Taichan 69 adalah warung sate yang terletak di Pantai Mertasari, tepatnya di Mertasari Culinary Center. Kami menyajikan sate taichan ayam dengan bumbu kacang dan sambal yang lezat, serta arak khas racikan rahasia yang siap
            menemani sore hari di pantai Mertasari.
          </p>
          <p>Buka Senin – Minggu, pukul 13.00 – 21.00 WITA.</p>
        </div>
      </section>

      {/* 🌟 Carousel Gallery Feedback */}
      <div className="carousel-secondary">
        <div className="carousel-gallery-wrapper">
  <div className="carousel-box">
    <Swiper
      modules={[Navigation, Autoplay]}
      navigation
      autoplay={{ delay: 3000 }}
      loop
      className="carousel-container"
    >
      {[gallery1, gallery2, gallery3, gallery4, gallery5, gallery6].map((img, i) => (
        <SwiperSlide key={i}>
          <img src={img} alt={`Gallery ${i + 1}`} className="carousel-image" />
        </SwiperSlide>
      ))}
    </Swiper>
  </div>

  {/* 🗣️ Judul & Caption langsung di bawahnya */}
  <h2 className="carousel-secondary-heading" style={{ marginTop: '20px', marginBottom: '5px' }}>
    Apa Kata Mereka?
  </h2>

 <div className={`gallery-caption-outside ${fade ? 'fade-in' : 'fade-out'}`}>
  {galleryCaptions.length > 0 ? (
    <div>
      <p>"{galleryCaptions[currentCaptionIndex].text}"</p>
      <div className="rating-display">
        {'★'.repeat(galleryCaptions[currentCaptionIndex].rating)}
        {'☆'.repeat(5 - galleryCaptions[currentCaptionIndex].rating)}
      </div>
      <span className="caption-name">- {galleryCaptions[currentCaptionIndex].name}</span>
    </div>
  ) : (
    <p>Belum ada feedback. Jadilah yang pertama memberi ulasan!</p>
  )}
</div>
</div>

      </div>

      {/* 📅 Reservasi */}
      <section id="reservation" className="reservation-fullscreen">
        <div className="reservation-overlay fade-in-section" ref={reservationRef}>
          <h2>Reservasi Meja</h2>
<p>Ingin pastikan kamu dapat tempat tanpa harus antre? Pesan meja sekarang dan nikmati santapan sore di Sate Taichan 69.</p>          <button className="order-button-home" onClick={handleReservationClick}>
            RESERVASI MEJA
          </button>
        </div>
      </section>

      <Footer />

      {/* 🔐 Popup Login */}
      {showLoginNotif && (
        <div className="notif-overlay">
          <div className="notif-card">
            <h3>Login Diperlukan</h3>
            <p>Untuk melakukan reservasi meja, kamu harus login terlebih dahulu.</p>
            <div className="notif-actions">
              <button onClick={() => navigate('/login')}>Login</button>
              <button onClick={() => setShowLoginNotif(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;
