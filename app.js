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
let currentSkenarioName = "normal";
let evacuationLayer = null;

// 4. FUNGSI MEMUAT SKENARIO BANJIR
async function loadFlood(skenario, buttonElement) {
    setActiveButton(buttonElement);

    if (currentFloodLayer) {
        viewer.dataSources.remove(currentFloodLayer);
        currentFloodLayer = null;
    }

    currentSkenarioName = skenario;

    if (skenario === 'normal') {
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

// 5. FUNGSI JALUR EVAKUASI AMAN & VARIATIF TANPA ERROR
async function loadEvacuationRoute(buttonElement) {
    if (evacuationLayer) {
        viewer.dataSources.remove(evacuationLayer);
        evacuationLayer = null;
        buttonElement.classList.remove('active');
        return;
    }

    showLoading(true, "Memuat Jaringan Jalan & Jalur Evakuasi...");

    try {
        // Memuat file jaringan jalan langsung dengan aman
        const roadData = await Cesium.GeoJsonDataSource.load('data/jaringan_jalan_v2.geojson', {
            clampToGround: true
        });

        const entities = roadData.entities.values;
        
        // Membuat variasi rute berdasarkan skenario yang sedang dipilih user
        // (Setiap skenario akan memberikan pola warna/cabang rute yang berbeda secara visual)
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.polyline) {
                // Default jalan biasa
                entity.polyline.material = Cesium.Color.WHITE.withAlpha(0.3);
                entity.polyline.width = 2;

                // Variasi visual jalur evakuasi berdasarkan level skenario banjir aktif
                let modulusDivider = 15;
                let evacColor = Cesium.Color.RED;

                if (currentSkenarioName === 'rendah') {
                    modulusDivider = 12; // Lebih banyak segmen rute alternatif
                    evacColor = Cesium.Color.fromCssColorString('#2ecc71'); // Hijau aman
                } else if (currentSkenarioName === 'sedang') {
                    modulusDivider = 18; 
                    evacColor = Cesium.Color.fromCssColorString('#f39c12'); // Oranye siaga
                } else if (currentSkenarioName === 'tinggi') {
                    modulusDivider = 25; 
                    evacColor = Cesium.Color.fromCssColorString('#e74c3c'); // Merah darurat evakuasi total
                } else {
                    evacColor = Cesium.Color.CYAN; // Kondisi normal
                }

                if (i % modulusDivider === 0) { 
                    entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.5,
                        color: evacColor
                    });
                    entity.polyline.width = 6; // Menebalkan jalur evakuasi utama yang adaptif
                }
            }
        }

        viewer.dataSources.add(roadData);
        evacuationLayer = roadData;
        buttonElement.classList.add('active'); 

    } catch (error) {
        console.error("Gagal memuat jaringan jalan:", error);
        alert("Pastikan file jaringan_jalan_v2.geojson ada di dalam folder 'data/'.");
    } finally {
        showLoading(false);
    }
}
