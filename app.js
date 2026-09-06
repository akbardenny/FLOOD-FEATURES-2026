// Opsional: Masukkan Access Token Cesium Ion Anda di sini nanti
// Cesium.Ion.defaultAccessToken = 'TOKEN_ANDA_NANTI';

// Inisialisasi Peta 3D (Viewer)
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain(), // Gunakan terrain bawaan dulu
    animation: false,       // Sembunyikan tombol animasi
    timeline: false,        // Sembunyikan garis waktu (timeline) bawah
    homeButton: true,
    navigationHelpButton: false,
    baseLayerPicker: true   // Biarkan pengguna bisa ganti peta satelit/jalan
});

// KOORDINAT DESA SIDODADI, PESAWARAN
const longitudeSidodadi = 105.255;
const latitudeSidodadi = -5.560;
const ketinggianKamera = 2500; // Dalam meter

// Menerbangkan kamera ke Desa Sidodadi saat web dibuka
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitudeSidodadi, latitudeSidodadi, ketinggianKamera),
    orientation: {
        heading: Cesium.Math.toRadians(0.0), // Arah Utara
        pitch: Cesium.Math.toRadians(-45.0), // Sudut kemiringan kamera 45 derajat melihat ke bawah
        roll: 0.0
    },
    duration: 3 // Lama durasi terbang dalam detik
});

// Variabel untuk menyimpan data banjir yang sedang aktif
let currentFloodLayer = null;

// Fungsi untuk memuat skenario dari folder data/
async function loadFlood(skenario) {
    // 1. Jika ada layer banjir sebelumnya, hapus dulu agar tidak menumpuk
    if (currentFloodLayer) {
        viewer.dataSources.remove(currentFloodLayer);
        currentFloodLayer = null;
    }

    // 2. Jika tombol yang ditekan adalah "Kondisi Normal", hentikan fungsi (peta bersih)
    if (skenario === 'normal') {
        return;
    }

    try {
        // 3. Panggil file GeoJSON sesuai nama skenario (contoh: data/skenario1.geojson)
        const dataSource = await Cesium.GeoJsonDataSource.load(`data/${skenario}.geojson`, {
            clampToGround: true // Menempel pada kontur tanah
        });

        // 4. Ubah warna poligon menjadi biru transparan layaknya air
        const entities = dataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            
            if (entity.polygon) {
                // Warna biru air dengan transparansi 60%
                entity.polygon.material = Cesium.Color.fromCssColorString('#3498db').withAlpha(0.6);
                
                // Jika Anda punya atribut "kedalaman" di QGIS, gunakan ini untuk ketebalan air 3D
                // Hapus tanda garis miring ganda (//) di bawah ini jika data GeoJSON Anda sudah siap
                // entity.polygon.extrudedHeight = entity.properties.kedalaman; 
            }
        }

        // 5. Tambahkan layer yang sudah diwarnai ke dalam peta
        viewer.dataSources.add(dataSource);
        
        // 6. Simpan informasi layer ini agar bisa dihapus saat ganti skenario
        currentFloodLayer = dataSource;

    } catch (error) {
        console.error("Gagal memuat data skenario:", error);
        alert(`File data/${skenario}.geojson belum tersedia di GitHub Anda.`);
    }
}
