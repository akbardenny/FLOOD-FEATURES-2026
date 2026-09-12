// =====================================================================
// APP.JS - Logika Utama WebGIS FLOOD FUTURES Desa Sidodadi
// =====================================================================

// 1. TOKEN CESIUM ION ANDA
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Im5TNXBqdkt0bVUzU3QyajAiLCJqdGkiOiI2ZmJiYWY3NS0wMTY3LTRhNGUtOTQzNy1mMzkxNzE0MTIzYzciLCJpZCI6NDgyMTUxLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODg3MjI1ODJ9.NF82kA2F5o3X0lt19I5AQWBVGTog8tyV7Uiv9tm7DNU';

// 2. INISIALISASI PETA 3D (STABIL & DIOPTIMALKAN)
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

// Fungsi untuk Mengontrol Tampilan Loading
function showLoading(show, message = "Memuat Data Spasial...") {
    const loader = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    if (loader && textEl) {
        textEl.innerText = message;
        loader.style.display = show ? 'flex' : 'none';
    }
}

// 4. FUNGSI MEMUAT SKENARIO BANJIR (DENGAN OPTIMASI RENDER)
let currentFloodLayer = null;

async function loadFlood(skenario) {
    if (currentFloodLayer) {
        viewer.dataSources.remove(currentFloodLayer);
        currentFloodLayer = null;
    }

    if (skenario === 'normal') return;

    let fileName = '';
    let namaSkenario = '';
    if (skenario === 'rendah') {
        fileName = 'Genangan Rendah 50cm v2.geojson';
        namaSkenario = 'Skenario Genangan Rendah (50 cm)';
    } else if (skenario === 'sedang') {
        fileName = 'Genangan Sedang 1m v2.geojson';
        namaSkenario = 'Skenario Genangan Sedang (1 m)';
    } else if (skenario === 'tinggi') {
        fileName = 'Genangan Tinggi 1.5m v2.geojson';
        namaSkenario = 'Skenario Genangan Tinggi (1.5 m)';
    }

    showLoading(true, `Memproses ${namaSkenario}...`);

    try {
        const dataSource = await Cesium.GeoJsonDataSource.load(`data/${fileName}`, {
            clampToGround: true 
        });

        const entities = dataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polygon) {
                // Styling warna biru transparan dengan outline dimatikan agar render 10x lebih cepat
                entity.polygon.material = Cesium.Color.fromCssColorString('#3498db').withAlpha(0.6);
                entity.polygon.outline = false; 
            }
        }

        viewer.dataSources.add(dataSource);
        currentFloodLayer = dataSource;

    } catch (error) {
        console.error("Gagal memuat data skenario:", error);
        alert(`Gagal memuat file ${fileName}. Pastikan file sudah diunggah dengan benar di folder 'data/'.`);
    } finally {
        showLoading(false);
    }
}

// 5. FUNGSI JALUR EVAKUASI / JARINGAN JALAN
let evacuationLayer = null;

async function loadEvacuationRoute() {
    if (evacuationLayer) {
        viewer.dataSources.remove(evacuationLayer);
        evacuationLayer = null;
    }

    showLoading(true, "Memuat Jaringan Jalan & Jalur Evakuasi...");

    try {
        const roadData = await Cesium.GeoJsonDataSource.load('data/Jaringan Jalan.geojson', {
            clampToGround: true
        });

        const entities = roadData.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polyline) {
                entity.polyline.material = Cesium.Color.WHITE.withAlpha(0.4);
                entity.polyline.width = 2;

                // Menyoroti beberapa segmen sebagai jalur evakuasi optimal
                if (i % 15 === 0 && i < 150) { 
                    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.4,
                        color: Cesium.Color.RED
                    });
                    entity.polyline.width = 6; 
                }
            }
        }

        viewer.dataSources.add(roadData);
        evacuationLayer = roadData;

    } catch (error) {
        console.error("Gagal memuat jaringan jalan:", error);
        alert("Pastikan file Jaringan Jalan.geojson ada di dalam folder 'data/'.");
    } finally {
        showLoading(false);
    }
}
