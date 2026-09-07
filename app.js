// =====================================================================
// APP.JS - Logika Utama WebGIS FLOOD FUTURES Desa Sidodadi
// =====================================================================

// 1. TOKEN CESIUM ION ANDA
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Im5TNXBqdkt0bVUzU3QyajAiLCJqdGkiOiI2ZmJiYWY3NS0wMTY3LTRhNGUtOTQzNy1mMzkxNzE0MTIzYzciLCJpZCI6NDgyMTUxLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODg3MjI1ODJ9.NF82kA2F5o3X0lt19I5AQWBVGTog8tyV7Uiv9tm7DNU';

// 2. INISIALISASI PETA 3D MENGGUNAKAN DTM SIDODADI (ID: 5826956)
const viewer = new Cesium.Viewer('cesiumContainer', {
    // Memanggil terrain lokal dari data DTM yang Anda unggah di Cesium Ion
    terrain: new Cesium.CesiumTerrainProvider({
        url: Cesium.IonResource.fromAssetId(5826956) 
    }),
    
    animation: false,            
    timeline: false,             
    homeButton: true,            
    navigationHelpButton: false, 
    baseLayerPicker: true,       
    
    // Optimasi agar ringan diakses di HP maupun Laptop (Anti-Lag)
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity
});

// Mematikan efek kabut agar pemandangan lokal lebih tajam
viewer.scene.fog.enabled = false;

// 3. PENGATURAN KAMERA & TOMBOL HOME KABUPATEN PESAWARAN
const posisiKameraPesawaran = {
    destination: Cesium.Cartesian3.fromDegrees(105.265, -5.565, 12000), 
    orientation: {
        heading: Cesium.Math.toRadians(0.0), 
        pitch: Cesium.Math.toRadians(-90.0), // Tampilan lurus dari atas
        roll: 0.0
    }
};

// Tampilan Awal saat Web Dibuka
viewer.camera.setView(posisiKameraPesawaran);

// Mengambil Alih Fungsi Tombol Home (Pojok Kanan Atas) agar kembali ke Pesawaran
viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
    e.cancel = true; 
    viewer.camera.flyTo({
        destination: posisiKameraPesawaran.destination,
        orientation: posisiKameraPesawaran.orientation,
        duration: 1.5 
    });
});

// 4. FUNGSI UNTUK MEMUAT SKENARIO BANJIR DARI FOLDER data/
let currentFloodLayer = null;

async function loadFlood(skenario) {
    if (currentFloodLayer) {
        viewer.dataSources.remove(currentFloodLayer);
        currentFloodLayer = null;
    }

    if (skenario === 'normal') {
        return;
    }

    try {
        // Memanggil file GeoJSON dari folder 'data' di GitHub Anda
        const dataSource = await Cesium.GeoJsonDataSource.load(`data/${skenario}.geojson`, {
            clampToGround: true // Membuat poligon air menempel mengikuti kontur DTM Sidodadi
        });

        const entities = dataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polygon) {
                // Warna biru air dengan transparansi 60%
                entity.polygon.material = Cesium.Color.fromCssColorString('#3498db').withAlpha(0.6);
            }
        }

        viewer.dataSources.add(dataSource);
        currentFloodLayer = dataSource;

    } catch (error) {
        console.error("Gagal memuat data skenario:", error);
        alert(`Gagal menampilkan! Pastikan file ${skenario}.geojson sudah diunggah ke dalam folder 'data' di GitHub Anda.`);
    }
}
