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

// Fungsi untuk Mengatur Tombol Mana yang Sedang Aktif
function setActiveButton(clickedButton) {
    const buttons = document.querySelectorAll('.control-panel button');
    buttons.forEach(btn => {
        if (btn.id !== 'btn-evakuasi') {
            btn.classList.remove('active');
        }
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

let currentFloodLayer = null;
let currentFloodFileName = null; 
let evacuationLayer = null;

// 4. FUNGSI MEMUAT SKENARIO BANJIR
async function loadFlood(skenario, buttonElement) {
    setActiveButton(buttonElement);

    if (currentFloodLayer) {
        viewer.dataSources.remove(currentFloodLayer);
        currentFloodLayer = null;
    }

    if (skenario === 'normal') {
        currentFloodFileName = null;
        return; 
    }

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

    currentFloodFileName = fileName; 
    showLoading(true, `Memproses ${namaSkenario}...`);

    try {
        const dataSource = await Cesium.GeoJsonDataSource.load(`data/${fileName}`, {
            clampToGround: true,
            stroke: Cesium.Color.TRANSPARENT,
            strokeWidth: 0,
            fill: Cesium.Color.fromCssColorString('#3498db').withAlpha(0.6)
        });

        viewer.dataSources.add(dataSource);
        currentFloodLayer = dataSource;

    } catch (error) {
        console.error("Gagal memuat data skenario:", error);
        alert(`Gagal memuat file ${fileName}. Pastikan file sudah diunggah dengan benar di folder 'data/'.`);
    } finally {
        showLoading(false);
    }
}

// 5. FUNGSI ANALISIS RUTE EVAKUASI AMAN (STABIL & AMAN DARI CRASH)
async function loadEvacuationRoute(buttonElement) {
    if (evacuationLayer) {
        viewer.dataSources.remove(evacuationLayer);
        evacuationLayer = null;
        buttonElement.classList.remove('active');
        return;
    }

    showLoading(true, "Menghitung Rute Evakuasi Optimal & Variatif...");

    try {
        // Muat Jaringan Jalan
        const roadResponse = await fetch('data/jaringan_jalan_v2.geojson');
        const roadGeoJson = await roadResponse.json();

        // Muat Genangan Aktif (jika ada)
        let floodGeoJson = null;
        if (currentFloodFileName) {
            try {
                const floodResponse = await fetch(`data/${currentFloodFileName}`);
                floodGeoJson = await floodResponse.json();
            } catch (e) {
                console.warn("Gagal memuat file genangan.");
            }
        }

        const dynamicFeatures = [];

        roadGeoJson.features.forEach(roadFeature => {
            if (!roadFeature.geometry) return;

            let isFlooded = false;

            if (floodGeoJson && floodGeoJson.features) {
                for (let floodFeature of floodGeoJson.features) {
                    if (floodFeature && floodFeature.geometry) {
                        try {
                            // Menggunakan pengecekan aman turf dengan try-catch terisolasi
                            if (turf.booleanIntersects(roadFeature, floodFeature)) {
                                isFlooded = true;
                                break;
                            }
                        } catch (err) {
                            // Abaikan error geometri tidak valid per fitur agar tidak menghentikan proses
                        }
                    }
                }
            }

            // Menyaring ruas jalan: Hijau jika aman, Merah jika tergenang
            if (!isFlooded) {
                roadFeature.properties = {
                    stroke: '#2ecc71',
                    isEvacRoute: true
                };
                dynamicFeatures.push(roadFeature);
            } else {
                roadFeature.properties = {
                    stroke: '#e74c3c',
                    isEvacRoute: false
                };
                dynamicFeatures.push(roadFeature);
            }
        });

        const analyzedGeoJson = {
            type: "FeatureCollection",
            features: dynamicFeatures
        };

        const roadData = await Cesium.GeoJsonDataSource.load(analyzedGeoJson, {
            clampToGround: true
        });

        const entities = roadData.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polyline && entity.properties) {
                const isEvac = entity.properties.isEvacRoute ? entity.properties.isEvacRoute.getValue() : false;

                if (isEvac) {
                    // Rute Evakuasi Utama yang Aman (Hijau Menyala & Variatif)
                    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.6,
                        color: Cesium.Color.fromCssColorString('#2ecc71')
                    });
                    entity.polyline.width = 7;
                } else {
                    // Jalur yang Terendam (Merah Pudar)
                    entity.polyline.material = Cesium.Color.fromCssColorString('#e74c3c').withAlpha(0.2);
                    entity.polyline.width = 2;
                }
            }
        }

        viewer.dataSources.add(roadData);
        evacuationLayer = roadData;
        buttonElement.classList.add('active'); 

    } catch (error) {
        console.error("Gagal memproses rute evakuasi variatif:", error);
        alert("Terjadi kesalahan saat memproses rute evakuasi adaptif.");
    } finally {
        showLoading(false);
    }
}
