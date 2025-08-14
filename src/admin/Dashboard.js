import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Styles/AdminDashboard.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const Dashboard = () => {
  const [filterWaktu, setFilterWaktu] = useState('bulan');
  const [ringkasan, setRingkasan] = useState(null);
  const [transaksi, setTransaksi] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [statistikMenu, setStatistikMenu] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const query = `?periode=${filterWaktu}`;

      const [resRingkasan, resTransaksi, resFeedback, resStatistikMenu] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard/ringkasan${query}`, { headers }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard/transaksi${query}`, { headers }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feedback`, { headers }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard/statistik-menu${query}`, { headers }),
      ]);

      if (!resRingkasan.ok || !resTransaksi.ok || !resFeedback.ok || !resStatistikMenu.ok) {
        throw new Error('Gagal mengambil data dashboard');
      }

      setRingkasan(await resRingkasan.json());
      const resTransaksiJson = await resTransaksi.json();
      setTransaksi(Array.isArray(resTransaksiJson) ? resTransaksiJson : resTransaksiJson.transaksi || []);
      setFeedback(await resFeedback.json());
      setStatistikMenu(await resStatistikMenu.json());
    } catch (error) {
      console.error('Gagal mengambil data dashboard:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Polling setiap 10 detik
    return () => clearInterval(interval); // Bersihkan interval saat unmount
  }, [filterWaktu]);

  const labelFilter = {
    hari: 'Hari Ini',
    minggu: 'Minggu Ini',
    bulan: 'Bulan Ini',
    tahun: 'Tahun Ini',
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Laporan Dashboard Admin', 14, 20);
    doc.setFontSize(12);
    doc.text(`Periode: ${labelFilter[filterWaktu]}`, 14, 30);

    // Ringkasan
    autoTable(doc, {
      startY: 40,
      head: [['Ringkasan', 'Nilai']],
      body: [
        ['Pesanan', ringkasan?.totalPesanan || 0],
        ['Pendapatan', `Rp ${ringkasan?.totalPendapatan?.toLocaleString('id-ID')}`],
        ['Meja Dipesan', ringkasan?.mejaDipesan || 0],
      ],
    });

    // Transaksi
    const transaksiData = transaksi.map((t, i) => [
      i + 1,
      t.nama || '-',
      t.meja || '-',
      `Rp ${t.total?.toLocaleString('id-ID')}`,
      t.jenis,
      new Date(t.waktu).toLocaleString('id-ID'),
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['No', 'Nama', 'Meja', 'Total', 'Jenis', 'Waktu']],
      body: transaksiData,
    });

    // Chart: convert to image using html2canvas
    const chartElement = document.getElementById('chart-screenshot');
    if (chartElement) {
      const canvas = await html2canvas(chartElement);
      const imgData = canvas.toDataURL('image/png');
      const chartHeight = 90;
      const chartWidth = 180;

      doc.addImage(imgData, 'PNG', 14, doc.lastAutoTable.finalY + 20, chartWidth, chartHeight);
    }

    // Tabel statistik menu (khusus PDF)
    autoTable(doc, {
      startY: doc.lastAutoTable?.finalY + 120 || 100,
      head: [['Menu', 'Total Terjual']],
      body: statistikMenu.map((item) => [item.nama, item.total]),
    });

    // Tambahkan total pendapatan di akhir
    doc.setFontSize(12);
    doc.text(
      `Total Pendapatan: Rp ${ringkasan?.totalPendapatan?.toLocaleString('id-ID') || 0}`,
      14,
      doc.lastAutoTable.finalY + 15
    );

    doc.save(`laporan-dashboard-${filterWaktu}.pdf`);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="custom-tooltip">
          <p><strong>{label}</strong></p>
          <p>Total: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Navbar />
      <div className="admin-dashboard-1">
        <h2>Dashboard Admin</h2>

        <div className="filter-waktu-tab">
          {Object.keys(labelFilter).map((periode) => (
            <button
              key={periode}
              onClick={() => setFilterWaktu(periode)}
              className={filterWaktu === periode ? 'tab-active' : 'tab-inactive'}
            >
              {labelFilter[periode]}
            </button>
          ))}
        </div>

        <button onClick={handleExportPDF} className="export-button">📄 Export PDF</button>

        <div className="dashboard-summary">
          <div className="dashboard-summary-box">
            <span>🔢</span>
            <div>
              <p>Pesanan {labelFilter[filterWaktu]}</p>
              <strong>{ringkasan?.totalPesanan || 0}</strong>
            </div>
          </div>
          <div className="dashboard-summary-box">
            <span>💰</span>
            <div>
              <p>Pendapatan {labelFilter[filterWaktu]}</p>
              <strong>Rp {ringkasan?.totalPendapatan?.toLocaleString('id-ID') || 0}</strong>
            </div>
          </div>
          <div className="dashboard-summary-box">
            <span>🪑</span>
            <div>
              <p>Meja Dipesan {labelFilter[filterWaktu]}</p>
              <strong>{ringkasan?.mejaDipesan || 0}</strong>
            </div>
          </div>
        </div>

        <h3 style={{ color: '#ffffffff' }}>Transaksi Terakhir</h3>
        <div className="dashboard-transaksi-container">
          <table className="dashboard-transaksi-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Meja</th>
                <th>Total</th>
                <th>Jenis</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {transaksi.map((t, index) => (
                <tr key={index}>
                  <td>{t.nama || '-'}</td>
                  <td>{t.meja || '-'}</td>
                  <td>Rp {t.total?.toLocaleString('id-ID') || 0}</td>
                  <td>
                    {t.jenis === 'Reservasi'
                      ? <span className="badge badge-reservasi">🪑 Reservasi</span>
                      : <span className="badge badge-pesanan">🍽️ Pesanan Menu</span>}
                  </td>
                  <td>{new Date(t.waktu).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ color: '#ffffffff' }}>Statistik Penjualan Menu</h3>
        <div className="dashboard-chart-wrapper" id="chart-screenshot">
          <h4 className="chart-subtitle">Penjualan Menu {labelFilter[filterWaktu]}</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={Array.isArray(statistikMenu) ? statistikMenu : []} 
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" />
              <XAxis 
                dataKey="nama" 
                interval={0} 
                angle={-45} 
                textAnchor="end"
                height={80}
                tick={{ fill: '#333', fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: '#333', fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString('id-ID')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill="#fd6e00ff" radius={[8, 8, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;