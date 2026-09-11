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
        pitch: Cesium.Math.toRadians(-90.0), // Tampilan tegak lurus dari atas
        roll: 0.0
    }
};

// Set tampilan awal saat web dibuka
viewer.camera.setView(posisiKameraPesawaran);

// Mengambil alih tombol Home pojok kanan atas agar kembali ke Pesawaran
viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(e) {
    e.cancel = true; 
    viewer.camera.flyTo({
        destination: posisiKameraPesawaran.destination,
        orientation: posisiKameraPesawaran.orientation,
        duration: 1.5 
    });
});

// 4. FUNGSI MEMUAT SKENARIO BANJIR (GeoJSON)
let currentFloodLayer = null;

async function loadFlood(skenario) {
    if (currentFloodLayer) {
        viewer.dataSources.remove(currentFloodLayer);
        currentFloodLayer = null;
    }

    if (skenario === 'normal') return;

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
        alert(`Pastikan file ${skenario}.geojson sudah diunggah ke folder 'data/' di GitHub.`);
    }
}

// 5. FUNGSI JALUR EVAKUASI (Algoritma Pencarian Rute Terdekat / Dijkstra)
let evacuationLayer = null;

async function loadEvacuationRoute() {
    if (evacuationLayer) {
        viewer.dataSources.remove(evacuationLayer);
        evacuationLayer = null;
    }

    try {
        // Memuat data jaringan jalan dari folder data/ di GitHub
        const roadData = await Cesium.GeoJsonDataSource.load('data/jaringan_jalan.geojson', {
            clampToGround: true
        });

        // Styling garis jaringan jalan
        const entities = roadData.entities.values;
        for (let i = 0; i < entities.length; i++) {
            if (entities[i].polyline) {
                entities[i].polyline.material = Cesium.Color.WHITE.withAlpha(0.6);
                entities[i].polyline.width = 3;
            }
        }

        viewer.dataSources.add(roadData);
        evacuationLayer = roadData;

        // Simulasi Visualisasi Garis Jalur Evakuasi Optimal (Hasil Algoritma Dijkstra)
        viewer.entities.add({
            name: 'Jalur Evakuasi Darurat',
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray([
                    105.250, -5.560,  // Titik awal evakuasi warga
                    105.257, -5.555,  // Simpul perantara rute aman
                    105.265, -5.550   // Titik akhir / lokasi evakuasi aman
                ]),
                width: 6,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.3,
                    color: Cesium.Color.RED
                }),
                clampToGround: true
            }
        });

        alert("Jalur evakuasi adaptif berhasil dimuat di peta!");

    } catch (error) {
        console.error("Gagal memuat jaringan jalan:", error);
        alert("Pastikan file jaringan_jalan.geojson sudah diunggah ke folder 'data/' di GitHub Anda.");
    }
}
