# 🌊 FLOOD FUTURES: WebGIS 3D Mitigasi Bencana Banjir
> **Studi Kasus:** Desa Sidodadi, Kecamatan Teluk Pandan, Kabupaten Pesawaran, Lampung.

[![CesiumJS](https://img.shields.io/badge/CesiumJS-v1.107-blue?style=flat-square&logo=cesium)](https://cesium.com/)
[![Turf.js](https://img.shields.io/badge/Turf.js-Spatial_Analysis-green?style=flat-square)](https://turfjs.org/)
[![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-success?style=flat-square&logo=github)](https://pages.github.com/)

## 📌 Tentang Proyek
**FLOOD FUTURES** adalah aplikasi berbasis *Web Geographic Information System* (WebGIS) 3D interaktif yang dirancang untuk memvisualisasikan skenario genangan banjir serta simulasi jalur evakuasi darurat secara spasial. Proyek ini dibangun untuk membantu perangkat desa dan masyarakat Desa Sidodadi dalam mitigasi risiko bencana, perencanaan tata ruang darurat, serta pengambilan keputusan yang cepat dan tepat.

## ✨ Fitur Utama
1. **Peta 3D Realistis (CesiumJS):** Visualisasi permukaan bumi dan kontur wilayah Desa Sidodadi berbasis teknologi globe 3D.
2. **Simulasi Multi-Skenario Genangan:** Pengguna dapat menguji tiga level kedalaman banjir secara instan:
   - Skenario Rendah (50 cm)
   - Skenario Sedang (1 m)
   - Skenario Tinggi (1.5 m)
3. **Analisis Jalur Evakuasi Adaptif:** Sistem menyaring jaringan jalan dan menyorot jalur aman (hijau menyala) yang terhindar dari genangan air.
4. **Fitur Pin Lokasi & Navigasi Personal:** Pengguna dapat menandai titik posisi mereka di peta untuk melihat orientasi jalur evakuasi terdekat.
5. **Antarmuka Responsif & Modern:** Panel kontrol intuitif dengan efek aktif visual yang ramah pengguna desktop maupun seluler.

## 🛠️ Teknologi yang Digunakan
* **Frontend Framework:** HTML5, CSS3, JavaScript (ES6+)
* **3D GIS Library:** CesiumJS (Ion SDK)
* **Spatial Analysis:** Turf.js
* **Data Format:** GeoJSON (`data/`)
* **Deployment:** GitHub Pages

## 📂 Struktur Direktori Repository
```text
FLOOD-FEATURES-2026/
│
├── index.html          # Antarmuka utama & styling UI
├── app.js              # Logika utama CesiumJS & interaksi peta
├── README.md           # Dokumentasi proyek
└── data/               # Folder penyimpanan data spasial GeoJSON
    ├── Genangan Rendah 50cm v2.geojson
    ├── Genangan Sedang 1m v2.geojson
    ├── Genangan Tinggi 1.5m v2.geojson
    └── Jaringan Jalan v2.geojson
