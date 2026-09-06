// =====================================================================
// APP.JS - Logika Utama WebGIS FLOOD FUTURES Desa Sidodadi
// =====================================================================

// 1. TOKEN CESIUM ION (Sudah diaktifkan menggunakan token Anda)
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Im5TNXBqdkt0bVUzU3QyajAiLCJqdGkiOiI2ZmJiYWY3NS0wMTY3LTRhNGUtOTQzNy1mMzkxNzE0MTIzYzciLCJpZCI6NDgyMTUxLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODg3MjI1ODJ9.NF82kA2F5o3X0lt19I5AQWBVGTog8tyV7Uiv9tm7DNU';

// 2. INISIALISASI PETA 3D (VIEWER)
const viewer = new Cesium.Viewer('cesiumContainer', {
    // Fitur kontur 3D (gunung/bukit) sudah diaktifkan kembali
    terrainProvider: Cesium.createWorldTerrain(), 
    
    animation: false,            // Menyembunyikan tombol play animasi di pojok kiri bawah
    timeline: false,             // Menyembunyikan garis waktu (timeline) di bagian bawah
    homeButton: true,            // Menampilkan tombol navigasi "Home"
    navigationHelpButton: false, // Menyembunyikan tombol panduan navigasi
    baseLayerPicker: true        // Mengizinkan pengguna mengganti jenis peta dasar (satelit/jalan)
});

// 3. KOORDINAT DESA SIDODADI, KECAMATAN TELUK PANDAN, PESAWARAN
const longitudeSidodadi = 105.255;
const latitudeSidodadi = -5.560;
const ketinggianKamera = 3000; // Ketinggian kamera dari permukaan tanah (dalam meter)

// Menerbangkan kamera ke Desa Sidodadi secara otomatis saat web dibuka
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitudeSidodadi, latitudeSidodadi, ketinggianKamera),
    orientation: {
        heading: Cesium.Math.toRadians(0.0), // Arah hadap kompas (0 = Utara)
        pitch: Cesium.Math.toRadians(-45.0), // Sudut kemiringan kamera (menunduk 45 derajat)
        roll: 0.0
    },
    duration: 3 // Lama transisi animasi terbang dari luar angkasa ke desa (dalam detik)
});

// 4. FUNGSI UNTUK MEMUAT SKENARIO BANJIR
// Variabel untuk menyimpan data banjir yang sedang tampil di layar
let currentFloodLayer = null;

async function loadFlood(skenario) {
    // A. Hapus layer skenario banjir sebelumnya jika ada (agar air tidak menumpuk)
    if (currentFloodLayer) {
        viewer.dataSources.remove(currentFloodLayer);
        currentFloodLayer = null;
    }

    // B. Jika pengguna menekan tombol "Kondisi Normal", peta dibiarkan bersih
    if (skenario === 'normal') {
        return;
    }

    try {
        // C. Memanggil file GeoJSON dari folder 'data' di dalam GitHub Anda
        // Pastikan nama file Anda sudah sesuai, contoh: data/skenario1.geojson
        const dataSource = await Cesium.GeoJsonDataSource.load(`data/${skenario}.geojson`, {
            clampToGround: true // Membuat poligon genangan air menempel mengikuti bentuk permukaan tanah
        });

        // D. Mengatur tampilan warna poligon menjadi seperti air banjir
        const entities = dataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            
            // Pastikan tipe datanya adalah poligon (area genangan)
            if (entity.polygon) {
                // Memberikan warna biru air laut/banjir (#3498db) dengan transparansi 60% (0.6)
                entity.polygon.material = Cesium.Color.fromCssColorString('#3498db').withAlpha(0.6);
                
                // (Opsi 3D Tingkat Lanjut) 
                // Jika data atribut GeoJSON Anda dari QGIS memiliki kolom bernama "kedalaman", 
                // hapus tanda // pada baris di bawah ini untuk membuat genangan airnya timbul/menebal:
                // entity.polygon.extrudedHeight = entity.properties.kedalaman; 
            }
        }

        // E. Tampilkan data skenario yang sudah diwarnai ke dalam peta
        viewer.dataSources.add(dataSource);
        
        // F. Simpan ke dalam variabel currentFloodLayer 
        currentFloodLayer = dataSource;

    } catch (error) {
        // Menampilkan pesan error pop-up jika file GeoJSON tidak ditemukan
        console.error("Gagal memuat data skenario:", error);
        alert(`Gagal menampilkan! Pastikan Anda sudah membuat dan mengunggah file ${skenario}.geojson ke dalam folder 'data' di GitHub Anda.`);
    }
}
