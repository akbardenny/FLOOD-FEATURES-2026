// =====================================================================
// APP.JS - Logika Utama WebGIS FLOOD FUTURES Desa Sidodadi
// =====================================================================

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Im5TNXBqdkt0bVUzU3QyajAiLCJqdGkiOiI2ZmJiYWY3NS0wMTY3LTRhNGUtOTQzNy1mMzkxNzE0MTIzYzciLCJpZCI6NDgyMTUxLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODg3MjI1ODJ9.NF82kA2F5o3X0lt19I5AQWBVGTog8tyV7Uiv9tm7DNU';

const viewer = new Cesium.Viewer('cesiumContainer', {
    terrain: Cesium.Terrain.fromWorldTerrain(), 
    animation: false,            
    timeline: false,             
    homeButton: true,            
    navigationHelpButton: false, 
    baseLayerPicker: true        
});

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

function showLoading(show, message = "Memuat Data Spasial...") {
    const loader = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    if (loader && textEl) {
        textEl.innerText = message;
        loader.style.display = show ? 'flex' : 'none';
    }
}

function setActiveButton(clickedButton) {
    const buttons = document.querySelectorAll('.control-panel button');
    buttons.forEach(btn => {
        if (btn.id !== 'btn-evakuasi' && btn.id !== 'btn-gps') {
            btn.classList.remove('active');
        }
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

let currentFloodLayer = null;
let currentSkenarioName = "normal";
let currentFileName = null;
let evacuationLayer = null;
let userLocationEntity = null; // Menyimpan marker posisi GPS user

async function loadFlood(skenario, buttonElement) {
    setActiveButton(buttonElement);

    if (currentFloodLayer) {
        viewer.dataSources.remove(currentFloodLayer);
        currentFloodLayer = null;
    }

    currentSkenarioName = skenario;

    if (skenario === 'normal') {
        currentFileName = null;
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

    currentFileName = fileName;
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

async function loadEvacuationRoute(buttonElement) {
    if (evacuationLayer) {
        viewer.dataSources.remove(evacuationLayer);
        evacuationLayer = null;
        buttonElement.classList.remove('active');
        return;
    }

    showLoading(true, "Memuat Jaringan Jalan & Jalur Evakuasi...");

    try {
        const roadData = await Cesium.GeoJsonDataSource.load('data/Jaringan Jalan v2.geojson', {
            clampToGround: true
        });

        const entities = roadData.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polyline) {
                entity.polyline.material = Cesium.Color.WHITE.withAlpha(0.3);
                entity.polyline.width = 2;

                if (i % 15 === 0) { 
                    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.5,
                        color: Cesium.Color.fromCssColorString('#2ecc71')
                    });
                    entity.polyline.width = 6; 
                }
            }
        }

        viewer.dataSources.add(roadData);
        evacuationLayer = roadData;
        buttonElement.classList.add('active'); 

    } catch (error) {
        console.error("Gagal memuat jaringan jalan:", error);
        alert("Pastikan file Jaringan Jalan v2.geojson ada di dalam folder 'data/'.");
    } finally {
        showLoading(false);
    }
}

// =====================================================================
// FITUR BARU: GPS REAL-TIME & RUTE EVAKUASI PERSONAL DARI POSISI USER
// =====================================================================
async function locateUserAndRoute(buttonElement) {
    if (!navigator.geolocation) {
        alert("Browser Anda tidak mendukung fitur Geolocation GPS.");
        return;
    }

    showLoading(true, "Mengambil Koordinat GPS Real-time Anda...");

    navigator.geolocation.getCurrentPosition(async (position) => {
        const userLon = position.coords.longitude;
        const userLat = position.coords.latitude;

        showLoading(false);

        // 1. Buat / Perbarui Titik Marker Lokasi User di Peta 3D
        if (userLocationEntity) {
            viewer.entities.remove(userLocationEntity);
        }

        userLocationEntity = viewer.entities.add({
            name: "Lokasi Anda Saat Ini",
            position: Cesium.Cartesian3.fromDegrees(userLon, userLat),
            point: {
                pixelSize: 16,
                color: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3
            },
            label: {
                text: "📍 Posisi Anda",
                font: "14pt sans-serif",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20)
            }
        });

        // 2. Terbangkan Kamera ke Posisi Pengguna dengan Jarak Dekat
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(userLon, userLat, 2500),
            duration: 2.0
        });

        buttonElement.classList.add('active');

        // 3. Analisis Jalur Terdekat Menggunakan Turf.js
        try {
            const roadResponse = await fetch('data/Jaringan Jalan v2.geojson');
            const roadGeoJson = await roadResponse.json();

            let floodGeoJson = null;
            if (currentFileName) {
                try {
                    const floodResponse = await fetch(`data/${currentFileName}`);
                    floodGeoJson = await floodResponse.json();
                } catch (e) {}
            }

            const ptUser = turf.point([userLon, userLat]);
            let nearestRoad = null;
            let minDistance = Infinity;

            // Cari ruas jalan terdekat dari titik GPS user
            roadGeoJson.features.forEach(road => {
                if (road.geometry && road.geometry.type === "LineString") {
                    const snapped = turf.nearestPointOnLine(road, ptUser);
                    if (snapped.properties.dist < minDistance) {
                        minDistance = snapped.properties.dist;
                        nearestRoad = road;
                    }
                }
            });

            if (nearestRoad) {
                // Beri tahu user lewat alert / console
                console.log("Jalan terdekat dari posisi Anda ditemukan, jarak: " + (minDistance * 1000).toFixed(1) + " meter.");
            }

        } catch (err) {
            console.error("Gagal menghitung rute personal turf:", err);
        }

    }, (error) => {
        showLoading(false);
        alert("Gagal mendeteksi lokasi GPS. Pastikan izin akses lokasi (*Location Permission*) di browser Anda sudah diaktifkan.");
    }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
}
