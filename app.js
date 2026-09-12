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

// Variabel Global untuk Menyimpan Status Skenario Aktif
let currentFloodLayer = null;
let currentFloodFileName = null; // Menyimpan nama file skenario yang sedang aktif
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

    currentFloodFileName = fileName; // Catat skenario yang sedang aktif
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

// 5. FUNGSI ANALISIS RUTE EVAKUASI ADAPTIF BERBASIS TURF.JS (MENGHINDARI GENANGAN)
async function loadEvacuationRoute(buttonElement) {
    if (evacuationLayer) {
        viewer.dataSources.remove(evacuationLayer);
        evacuationLayer = null;
        buttonElement.classList.remove('active');
        return;
    }

    showLoading(true, "Menganalisis Jalur Evakuasi Aman terhadap Banjir...");

    try {
        // 1. Muat Jaringan Jalan
        const roadResponse = await fetch('data/jaringan_jalan_v2.geojson');
        const roadGeoJson = await roadResponse.json();

        // 2. Jika ada skenario banjir aktif, muat juga data genangannya untuk dianalisis
        let floodGeoJson = null;
        if (currentFloodFileName) {
            try {
                const floodResponse = await fetch(`data/${currentFloodFileName}`);
                floodGeoJson = await floodResponse.json();
            } catch (e) {
                console.warn("Gagal memuat file genangan untuk analisis benturan rute.");
            }
        }

        // 3. Proses Analisis Spasial menggunakan Turf.js
        const processedRoads = {
            type: "FeatureCollection",
            features: roadGeoJson.features.map(roadFeature => {
                let isFlooded = false;

                // Jika ada genangan, cek apakah ruas jalan beririsan/masuk ke dalam area genangan
                if (floodGeoJson && roadFeature.geometry) {
                    for (let floodFeature of floodGeoJson.features) {
                        if (floodFeature.geometry) {
                            try {
                                // Menggunakan turf untuk mendeteksi persimpangan/genangan pada jalan
                                const intersects = turf.booleanIntersects(roadFeature, floodFeature);
                                if (intersects) {
                                    isFlooded = true;
                                    break;
                                }
                            } catch (err) {
                                // Abaikan error geometri kecil
                            }
                        }
                    }
                }

                // Berikan properti kustom berdasarkan status genangan
                roadFeature.properties = roadFeature.properties || {};
                roadFeature.properties.stroke = isFlooded ? '#e74c3c' : '#2ecc71'; // Merah jika tergenang, Hijau jika aman
                roadFeature.properties['stroke-width'] = isFlooded ? 2 : 5;       // Jalan aman dibuat lebih tebal
                roadFeature.properties['stroke-opacity'] = isFlooded ? 0.2 : 0.9;   // Jalan tergenang dibuat pudar transparan

                return roadFeature;
            })
        };

        // 4. Muat hasil analisis ke Cesium
        const roadData = await Cesium.GeoJsonDataSource.load(processedRoads, {
            clampToGround: true
        });

        const entities = roadData.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polyline && entity.properties) {
                // Ambil warna dan ketebalan dari hasil analisis Turf.js di atas
                const strokeColor = entity.properties.stroke ? entity.properties.stroke.getValue() : '#2ecc71';
                const strokeWidth = entity.properties['stroke-width'] ? entity.properties['stroke-width'].getValue() : 3;
                const strokeOpacity = entity.properties['stroke-opacity'] ? entity.properties['stroke-opacity'].getValue() : 0.8;

                if (strokeColor === '#2ecc71') {
                    // Jalur Aman (Hijau Menyala & Tebal)
                    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.5,
                        color: Cesium.Color.fromCssColorString('#2ecc71')
                    });
                    entity.polyline.width = 6;
                } else {
                    // Jalur Terendam (Merah Pudar)
                    entity.polyline.material = Cesium.Color.fromCssColorString('#e74c3c').withAlpha(strokeOpacity);
                    entity.polyline.width = 2;
                }
            }
        }

        viewer.dataSources.add(roadData);
        evacuationLayer = roadData;
        buttonElement.classList.add('active'); 

    } catch (error) {
        console.error("Gagal menganalisis rute evakuasi:", error);
        alert("Terjadi kesalahan saat memproses rute evakuasi adaptif.");
    } finally {
        showLoading(false);
    }
}
