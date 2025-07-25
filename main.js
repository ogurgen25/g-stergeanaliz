const map = L.map('map').setView([39.75, 39.5], 13);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles © Esri'
}).addTo(map);

const satislar = [];
let markers = [];
let heat; // heatmap objesi

map.on('click', function(e) {
  const latlng = e.latlng;
  const popupContent = `
    <b>Satış Bilgisi Girişi</b><br>
    Ada: <input id="ada" type="text"><br>
    Parsel: <input id="parsel" type="text"><br>
    Fiyat (₺): <input id="fiyat" type="number"><br>
    m²: <input id="metrekare" type="number"><br>
    Nitelik:
    <select id="nitelik">
      <option value="Konut">Konut</option>
      <option value="İşyeri">İşyeri</option>
      <option value="Arsa">Arsa</option>
    </select><br>
    Tarih: <input id="tarih" type="date"><br><br>
    <button onclick="kaydet(${latlng.lat}, ${latlng.lng})">Kaydet</button>
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
    ada, parsel, fiyat, metrekare,
    birim_fiyat: fiyat / metrekare,
    nitelik, tarih, konum: [lat, lng]
  };

  satislar.push(veri);
  map.closePopup();

  addMarker(veri);
  analizGuncelle();
}

function addMarker(veri) {
  const marker = L.marker(veri.konum).addTo(map);
  marker.bindPopup(`
    <b>${veri.nitelik}</b><br>
    Ada: ${veri.ada}, Parsel: ${veri.parsel}<br>
    Fiyat: ${veri.fiyat.toLocaleString()} ₺<br>
    m²: ${veri.metrekare} — ${Math.round(veri.birim_fiyat)} ₺/m²<br>
    Tarih: ${veri.tarih}
  `);
  markers.push({ marker, veri });
}

function analizGuncelle() {
  if (satislar.length === 0) return document.getElementById("analizPanel").innerHTML = "";

  const toplam = satislar.length;
  const ortBirim = (satislar.reduce((s, v) => s + v.birim_fiyat, 0)) / toplam;

  const konutlar = satislar.filter(v => v.nitelik === "Konut");
  const isyerleri = satislar.filter(v => v.nitelik === "İşyeri");
  const arsalar = satislar.filter(v => v.nitelik === "Arsa");

  const panel = `
    <hr>
    <b>Toplam Satış:</b> ${toplam} adet<br>
    <b>Genel Ortalama:</b> ${Math.round(ortBirim)} ₺/m²<br>
    <b>Konut:</b> ${konutlar.length} — ${ortalama(konutlar)} ₺/m²<br>
    <b>İşyeri:</b> ${isyerleri.length} — ${ortalama(isyerleri)} ₺/m²<br>
    <b>Arsa:</b> ${arsalar.length} — ${ortalama(arsalar)} ₺/m²<br>
  `;
  document.getElementById("analizPanel").innerHTML = panel;
}

function ortalama(veriler) {
  if (veriler.length === 0) return "-";
  const ort = veriler.reduce((s, v) => s + v.birim_fiyat, 0) / veriler.length;
  return Math.round(ort);
}

function filtrele(tur) {
  // Haritayı temizle
  markers.forEach(obj => map.removeLayer(obj.marker));
  markers = [];

  satislar.forEach(veri => {
    if (tur === "Tümü" || veri.nitelik === tur) {
      addMarker(veri);
    }
  });
}

function jsonKaydet() {
  const blob = new Blob([JSON.stringify(satislar, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "satis_verileri.json";
  a.click();
  URL.revokeObjectURL(url);
}

function jsonYukle() {
  const file = document.getElementById("jsonInput").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const json = JSON.parse(e.target.result);
    json.forEach(veri => {
      satislar.push(veri);
      addMarker(veri);
    });
    analizGuncelle();
  };
  reader.readAsText(file);
}

// Heatmap
function heatmapToggle() {
  if (heat) {
    map.removeLayer(heat);
    heat = null;
  } else {
    const heatPoints = satislar.map(v => [...v.konum, 0.5]);
    heat = L.heatLayer(heatPoints, { radius: 25, blur: 15 }).addTo(map);
  }
}
