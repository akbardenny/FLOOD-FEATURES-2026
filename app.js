// =====================================================================
// APP.JS - Logika Utama WebGIS FLOOD FUTURES Desa Sidodadi
// =====================================================================

// 1. TOKEN CESIUM ION 
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Im5TNXBqdkt0bVUzU3QyajAiLCJqdGkiOiI2ZmJiYWY3NS0wMTY3LTRhNGUtOTQzNy1mMzkxNzE0MTIzYzciLCJpZCI6NDgyMTUxLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODg3MjI1ODJ9.NF82kA2F5o3X0lt19I5AQWBVGTog8tyV7Uiv9tm7DNU';

// 2. INISIALISASI PETA 3D (VIEWER) - VERSI SUPER RINGAN
const viewer = new Cesium.Viewer('cesiumContainer', {
    // Memuat kontur dengan mematikan efek cahaya dan pantulan air laut asli yang berat
    terrain: Cesium.Terrain.fromWorldTerrain({
        requestWaterMask: false,
        requestVertexNormals: false
    }), 
    
    // Mematikan tombol-tombol UI yang tidak perlu agar web lebih ringan
    animation: false,            
    timeline: false,             
    homeButton: true,            
    navigationHelpButton: false, 
    baseLayerPicker: false,      // Dimatikan sementara agar tidak meload banyak gambar peta
    geocoder: false,
    sceneModePicker: false,

    // KUNCI ANTI-LAG: Peta hanya di-render saat kamera digerakkan
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity
});

// Matikan efek kabut atmosfer resolusi tinggi
viewer.scene.fog.enabled = false;
viewer.scene.globe.showWaterEffect = false;

// 3. KOORDINAT DESA SIDODADI, KECAMATAN TELUK PANDAN, PESAWARAN
const longitudeSidodadi = 105.255;
const latitudeSidodadi = -5.560;
const ketinggianKamera = 3000; 

viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitudeSidodadi, latitudeSidodadi, ketinggianKamera),
    orientation: {
        heading: Cesium.Math.toRadians(0.0), 
        pitch: Cesium.Math.toRadians(-45.0), 
        roll: 0.0
    },
    duration: 3 
});

// 4. FUNGSI UNTUK MEMUAT SKENARIO BANJIR
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
        const dataSource = await Cesium.GeoJsonDataSource.load(`data/${skenario}.geojson`, {
            clampToGround: true 
        });

        const entities = dataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            
            if (entity.polygon) {
                entity.polygon.material = Cesium.Color.fromCssColorString('#3498db').withAlpha(0.6);
            }
        }

        viewer.dataSources.add(dataSource);
        currentFloodLayer = dataSource;

    } catch (error) {
        console.error("Gagal memuat data skenario:", error);
        alert(`Gagal menampilkan! Pastikan Anda sudah membuat dan mengunggah file ${skenario}.geojson ke dalam folder 'data' di GitHub Anda.`);
    }
}
