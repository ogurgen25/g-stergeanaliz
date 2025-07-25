const map = L.map('map').setView([39.905, 41.275], 13); // Erzurum merkez

// Uydu harita altlığı
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles © Esri'
}).addTo(map);

// Satış verilerini tutar
const satislar = [];
let markers = [];

map.on('click', function(e) {
  const latlng = e.latlng;
  const popupContent = `
    <div class="popup-form">
      <label for="ada">Ada:</label>
      <input id="ada" type="text">

      <label for="parsel">Parsel:</label>
      <input id="parsel" type="text">

      <label for="fiyat">Fiyat (₺):</label>
      <input id="fiyat" type="number">

      <label for="metrekare">m²:</label>
      <input id="metrekare" type="number">

      <label for="nitelik">Nitelik:</label>
      <select id="nitelik">
        <option value="Konut">Konut</option>
        <option value="İşyeri">İşyeri</option>
        <option value="Arsa">Arsa</option>
      </select>

      <label for="tarih">Tarih:</label>
      <input id="tarih" type="date">

      <button onclick="kaydet(${latlng.lat}, ${latlng.lng})">KAYDET</button>
    </div>
  `;

  L.popup().setLatLng(latlng).setContent(popupContent).openOn(map);
});

function kaydet(lat, lng) {
  const ada = document.getElementById("ada").value;
  const parsel = document.getElementById("parsel").value;
  const fiyat = parseFloat(document.getElementById("fiyat").value);
  const metrekare = parseFloat(document.getElementById("metrekare").value);
  const nitelik = document.getElementById("nitelik").value;
  const tarih = document.getElementById("tarih").value;

  const veri = {
    ada,
    parsel,
    fiyat,
    metrekare,
    birim_fiyat: fiyat / metrekare,
    nitelik,
    tarih,
    konum: [lat, lng]
  };

  satislar.push(veri);
  map.closePopup();

  const marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup(`
    <b>${nitelik}</b><br>
    Ada: ${ada}, Parsel: ${parsel}<br>
    Fiyat: ${fiyat.toLocaleString()} ₺<br>
    m²: ${metrekare} — ${Math.round(veri.birim_fiyat)} ₺/m²<br>
    Tarih: ${tarih}
  `);
  markers.push(marker);
}
