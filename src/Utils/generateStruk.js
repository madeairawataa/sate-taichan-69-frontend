// src/utils/generateStruk.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(n || 0));

const formatTanggalJam = (date) => {
  try {
    const d = new Date(date);
    const tgl = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return { tgl, jam };
  } catch {
    return { tgl: '-', jam: '-' };
  }
};

// Generate Struk Reservasi
export const generateStruk = (reserv) => {
  if (!reserv) return;

  const namaToko = 'Sate Taichan 69';
  const alamatToko = 'Mertasari Culinary Center, Pantai Mertasari, Sanur, Bali';
  const telpToko = '087759744555';

  const noReservasi = reserv.noReservasi || reserv.uuid || '-';
  const nama = reserv.nama || '-';
  const meja = reserv.meja || '-';
  const tanggalReservasi = reserv.tanggalReservasi || new Date().toISOString();
  const { tgl, jam } = formatTanggalJam(new Date());
  const tanggalReservasiFix = new Date(tanggalReservasi).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const waktuSlot = reserv.waktu || '-';
  const jumlahOrang = reserv.jumlahOrang || 1;

  const biayaLayanan = 25000;
  const total = biayaLayanan;

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 160],
  });

  const pageWidth = 80;
  let y = 6;

  const centerText = (text, size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
    y += size * 0.5 + 2;
  };

  const dashedLine = () => {
    doc.setLineDash([1, 1], 0);
    doc.line(4, y, pageWidth - 4, y);
    doc.setLineDash();
    y += 2.5;
  };

  centerText(namaToko.toUpperCase(), 12, true);
  centerText(alamatToko, 8);
  centerText(`Telp: ${telpToko}`, 8);
  dashedLine();

  doc.setFontSize(9);
  doc.text(`No. Reservasi : ${noReservasi}`, 4, y); y += 4;
  doc.text(`Tanggal Cetak : ${tgl} ${jam}`, 4, y); y += 4;
  dashedLine();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('DETAIL RESERVASI', 4, y); y += 5;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`Nama Pemesan : ${nama}`, 4, y); y += 4;
  doc.text(`Nomor Meja   : ${meja}`, 4, y); y += 4;
  doc.text(`Tanggal      : ${tanggalReservasiFix}`, 4, y); y += 4;
  doc.text(`Waktu        : ${waktuSlot}`, 4, y); y += 4;
  doc.text(`Jumlah Orang : ${jumlahOrang}`, 4, y); y += 6;
  dashedLine();

  const startY = y;
  const body = [
    ['Biaya Layanan Reservasi', '1', `Rp${formatRupiah(biayaLayanan)}`, `Rp${formatRupiah(biayaLayanan)}`],
  ];

  autoTable(doc, {
    startY,
    styles: { fontSize: 9, cellPadding: 1 },
    margin: { left: 4, right: 4 },
    head: [['Deskripsi', 'Qty', 'Harga', 'Subtotal']],
    body,
    theme: 'plain',
    headStyles: { fontStyle: 'bold' },
  });

  y = doc.lastAutoTable.finalY + 2;
  dashedLine();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(`TOTAL : Rp${formatRupiah(total)}`, 4, y); y += 6;
  doc.setFont('helvetica', 'normal');

  doc.setFontSize(8);
  doc.text('Biaya layanan bersifat non-refundable.', 4, y); y += 4;
  doc.text('Simpan struk ini sebagai bukti reservasi.', 4, y); y += 4;
  doc.text('Untuk informasi lebih lanjut hubungi nomor di atas.', 4, y); y += 4;

  dashedLine();

  centerText('TERIMA KASIH', 10, true);
  centerText('Selamat menikmati kunjungan Anda!', 8, false);

  const filenameSafe = `${noReservasi}`.replace(/[^a-zA-Z0-9-_]/g, '');
  doc.save(`Struk_Reservasi_${filenameSafe}.pdf`);
};

// Generate Struk Pesanan
export const generateStrukPesanan = (pesanan) => {
  if (!pesanan) return;

  const namaToko = 'Sate Taichan 69';
  const alamatToko = 'Mertasari Culinary Center, Pantai Mertasari, Sanur, Bali';
  const telpToko = '087759744555';

  const nomorPesanan = pesanan.nomorPesanan || '-';
  const nama = pesanan.namaPemesan || '-';
  const tipePesanan = pesanan.tipePesanan || '-';
  const nomorMeja = pesanan.nomorMeja || '-';
  const catatan = pesanan.catatan || '-';
  const status = pesanan.status || 'Menunggu';
  const totalHarga = pesanan.totalHarga || 0;
  const items = pesanan.items || [];
  
  const { tgl: tglPesan, jam: jamPesan } = formatTanggalJam(pesanan.createdAt);
  const { tgl: tglCetak, jam: jamCetak } = formatTanggalJam(new Date());

  // Ukuran kertas disesuaikan dengan jumlah items tapi lebih mirip dengan format reservasi
  const estimatedHeight = Math.max(180, 120 + (items.length * 10));
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, estimatedHeight],
  });

  const pageWidth = 80;
  let y = 6;

  const centerText = (text, size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
    y += size * 0.5 + 2;
  };

  const dashedLine = () => {
    doc.setLineDash([1, 1], 0);
    doc.line(4, y, pageWidth - 4, y);
    doc.setLineDash();
    y += 2.5;
  };

  // Header Toko - sama seperti reservasi
  centerText(namaToko.toUpperCase(), 12, true);
  centerText(alamatToko, 8);
  centerText(`Telp: ${telpToko}`, 8);
  dashedLine();

  // Info Pesanan - format mirip reservasi
  doc.setFontSize(9);
  doc.text(`No. Pesanan  : ${nomorPesanan}`, 4, y); y += 4;
  doc.text(`Tanggal Pesan: ${tglPesan} ${jamPesan}`, 4, y); y += 4;
  doc.text(`Tanggal Cetak: ${tglCetak} ${jamCetak}`, 4, y); y += 4;
  dashedLine();

  // Header Detail - sama seperti reservasi
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('DETAIL PESANAN', 4, y); y += 5;

  // Detail Pesanan - format mirip reservasi
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`Nama Pemesan : ${nama}`, 4, y); y += 4;
  doc.text(`Tipe Pesanan : ${tipePesanan}`, 4, y); y += 4;
  
  if (tipePesanan === 'Dine In' && nomorMeja !== '-') {
    doc.text(`Nomor Meja   : ${nomorMeja}`, 4, y); y += 4;
  }
    
  if (catatan !== '-') {
    doc.text(`Catatan      : ${catatan}`, 4, y); y += 4;
  }
  
  y += 2;
  dashedLine();

  // Tabel Items - tetap menggunakan autoTable tapi dengan format lebih ringkas
  if (items.length > 0) {
    const tableData = items.map(item => [
      item.nama || '-',
      item.jumlah?.toString() || '0',
      `Rp${formatRupiah(item.harga || 0)}`,
      `Rp${formatRupiah((item.harga || 0) * (item.jumlah || 0))}`
    ]);

    autoTable(doc, {
      startY: y,
      styles: { fontSize: 9, cellPadding: 1 },
      margin: { left: 4, right: 4 },
      head: [['Item', 'Qty', 'Harga', 'Subtotal']],
      body: tableData,
      theme: 'plain',
      headStyles: { fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 32 }, // Item
        1: { cellWidth: 12, halign: 'center' }, // Qty  
        2: { cellWidth: 15, halign: 'right' }, // Harga
        3: { cellWidth: 15, halign: 'right' }  // Subtotal
      }
    });

    y = doc.lastAutoTable.finalY + 2;
  }

  dashedLine();

  // Total - sama seperti reservasi
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(`TOTAL : Rp${formatRupiah(totalHarga)}`, 4, y); y += 6;
  doc.setFont('helvetica', 'normal');

  // Status Info - format mirip reservasi
  doc.setFontSize(8);
  if (status === 'Selesai') {
    doc.text('Pesanan telah selesai. Terima kasih!', 4, y); y += 4;
  } else if (status === 'Dibatalkan') {
    doc.text('Pesanan dibatalkan.', 4, y); y += 4;
  } else {
    doc.text('Simpan struk ini sebagai bukti pesanan.', 4, y); y += 4;
  }
  
  doc.text('Untuk informasi lebih lanjut hubungi nomor di atas.', 4, y); y += 4;

  dashedLine();

  // Footer - sama seperti reservasi
  centerText('TERIMA KASIH', 10, true);
  centerText('Selamat menikmati makanan Anda!', 8, false);

  // Save PDF
  const filenameSafe = `${nomorPesanan}`.replace(/[^a-zA-Z0-9-_]/g, '');
  doc.save(`Struk_Pesanan_${filenameSafe}.pdf`);
};