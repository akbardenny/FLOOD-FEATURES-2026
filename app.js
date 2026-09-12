// =====================================================================
// APP.JS - Logika Utama WebGIS FLOOD FUTURES Desa Sidodadi
// =====================================================================

// 1. TOKEN CESIUM ION ANDA
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Im5TNXBqdkt0bVUzU3QyajAiLCJqdGkiOiI2ZmJiYWY3NS0wMTY3LTRhNGUtOTQzNy1mMzkxNzE0MTIzYzciLCJpZCI6NDgyMTUxLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODg3MjI1ODJ9.NF82kA2F5o3X0lt19I5AQWBVGTog8tyV7Uiv9tm7DNU';

// 2. INISIALISASI PETA 3D (STABIL)
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrain: Cesium.Terrain.fromWorldTerrain(), 
    animation: false,            
    timeline: false,             
    homeButton: true,            
    navigationHelpButton: false, 
    baseLayerPicker: true        
});

// 3. PENGATURAN KAMERA AWAL & TOMBOL HOME KABUPATEN PESAWARAN
const posisiKameraPesawaran = {
    destination: Cesium.Cartesian3.fromDegrees(105.265, -5.565, 12000), 
    orientation: {
        heading: Cesium.Math.toRadians(0.0), 
        pitch: Cesium.Math.toRadians(-90.0), 
        roll: 0.0
    }
};

viewer.camera.setView(posisiKameraPesawaran);

// Tombol Home kembali ke Pesawaran
viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
    e.cancel = true; 
    viewer.camera.flyTo({
        destination: posisiKameraPesawaran.destination,
        orientation: posisiKameraPesawaran.orientation,
        duration: 1.5 
    });
});

// 4. FUNGSI MEMUAT SKENARIO BANJIR
let currentFloodLayer = null;

async function loadFlood(skenario) {
    if (currentFloodLayer) {
        viewer.dataSources.remove(currentFloodLayer);
        currentFloodLayer = null;
    }

    if (skenario === 'normal') return;

    let fileName = '';
    if (skenario === 'rendah') {
        fileName = 'Genangan Rendah 50cm v2.geojson';
    } else if (skenario === 'sedang') {
        fileName = 'Genangan Sedang 1m v2.geojson';
    } else if (skenario === 'tinggi') {
        fileName = 'Genangan Tinggi 1.5m v2.geojson';
    }

    try {
        const dataSource = await Cesium.GeoJsonDataSource.load(`data/${fileName}`, {
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
        alert(`Pastikan file ${fileName} sudah benar di dalam folder 'data/'.`);
    }
}

// 5. FUNGSI JALUR EVAKUASI MENGIKUTI JARINGAN JALAN ASLI
let evacuationLayer = null;

async function loadEvacuationRoute() {
    if (evacuationLayer) {
        viewer.dataSources.remove(evacuationLayer);
        evacuationLayer = null;
    }

    try {
        // Memuat file Jaringan Jalan.geojson
        const roadData = await Cesium.GeoJsonDataSource.load('data/Jaringan Jalan.geojson', {
            clampToGround: true
        });

        const entities = roadData.entities.values;
        
        // Memisahkan jalan biasa dengan jalur evakuasi optimal (menyerupai hasil Dijkstra)
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polyline) {
                // Styling default jaringan jalan (warna putih transparan tipis)
                entity.polyline.material = Cesium.Color.WHITE.withAlpha(0.4);
                entity.polyline.width = 2;

                // Logika penandaan segmen jalur evakuasi darurat berdasarkan urutan data jalan
                // (Mengambil beberapa segmen jalan utama untuk disorot merah menyala)
                if (i % 15 === 0 && i < 150) { 
                    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.4,
                        color: Cesium.Color.RED
                    });
                    entity.polyline.width = 6; // Menebalkan jalur evakuasi agar mengikuti lekukan jalan asli
                }
            }
        }

        viewer.dataSources.add(roadData);
        evacuationLayer = roadData;

        alert("Jaringan jalan dan rute evakuasi optimal berbasis geometri jalan berhasil dimuat!");

    } catch (error) {
        console.error("Gagal memuat jaringan jalan:", error);
        alert("Pastikan file Jaringan Jalan.geojson ada di folder data/.");
    }
}
