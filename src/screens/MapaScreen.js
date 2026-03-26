import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import antenasData from "../assets/antenas_AL.json";

const COR = { "GSM":"#ff6600", "WCDMA":"#ffaa00", "LTE":"#00d4ff", "NR":"#00ff88" };
const LABEL = { "GSM":"2G", "WCDMA":"3G", "LTE":"4G", "NR":"5G" };
const RAIO = { "GSM":10000, "WCDMA":5000, "LTE":2000, "NR":500 };

export default function MapaScreen() {
  const [localizacao, setLocalizacao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("Todas");
  const [mostrarRaios, setMostrarRaios] = useState(false);

  useEffect(() => { iniciar(); }, []);

  async function iniciar() {
    setCarregando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocalizacao(loc.coords);
      }
    } catch(e) {}
    setCarregando(false);
  }

  function filtrarProximas(lat, lon, raioKm = 5) {
    return antenasData.filter(a => {
      const dlat = (a.lat - lat) * 111;
      const dlon = (a.lon - lon) * 111 * Math.cos(lat * Math.PI / 180);
      return Math.sqrt(dlat*dlat + dlon*dlon) <= raioKm;
    });
  }

  const lat = localizacao?.latitude || -9.6658;
  const lon = localizacao?.longitude || -35.7350;

  const tecMap = { "Todas": null, "5G": "NR", "4G": "LTE", "3G": "WCDMA", "2G": "GSM" };
  let antenasFiltradas = filtrarProximas(lat, lon, 5);
  if (filtro !== "Todas") {
    antenasFiltradas = antenasFiltradas.filter(a => a.tec === tecMap[filtro]);
  }

  function gerarHTML() {
    const marcadores = antenasFiltradas.map((a, i) => {
      const cor = COR[a.tec] || "#fff";
      const label = LABEL[a.tec] || a.tec;
      const raio = RAIO[a.tec] || 2000;
      return `
        var ic${i} = L.divIcon({
          html: '<div style="background:${cor};color:#000;font-size:9px;font-weight:bold;padding:2px 5px;border-radius:6px;white-space:nowrap;">📡 ${label}</div>',
          className:"", iconAnchor:[20,10]
        });
        L.marker([${a.lat},${a.lon}], {icon:ic${i}}).addTo(map)
          .bindPopup("<b>${label} - ${a.tec}</b><br><b>Operadora:</b> ${a.op}<br><b>Município:</b> ${a.mun}<br><b>Freq:</b> ${a.freq} MHz");
        ${mostrarRaios ? `L.circle([${a.lat},${a.lon}],{radius:${raio},color:"${cor}",fillOpacity:0.05,weight:1}).addTo(map);` : ""}
      `;
    }).join("");

    return `<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body{margin:0;padding:0;}
        #map{width:100%;height:100vh;}
        .leaflet-popup-content-wrapper{background:#111827;color:#fff;border:1px solid #1a2540;}
        .leaflet-popup-tip{background:#111827;}
      </style>
    </head><body><div id="map"></div><script>
      var map = L.map("map").setView([${lat},${lon}],14);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{maxZoom:19}).addTo(map);
      var icUser = L.divIcon({
        html:'<div style="width:16px;height:16px;background:#00d4ff;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px #00d4ff;"></div>',
        className:"",iconAnchor:[8,8]
      });
      L.marker([${lat},${lon}],{icon:icUser}).addTo(map).bindPopup("<b>Voce esta aqui</b>");
      ${marcadores}
    </script></body></html>`;
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingTexto}>Carregando antenas reais...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: gerarHTML() }}
        style={styles.mapa}
        javaScriptEnabled={true}
        originWhitelist={["*"]}
      />

      <ScrollView horizontal style={styles.filtros} showsHorizontalScrollIndicator={false}>
        {["Todas","5G","4G","3G","2G"].map(t => (
          <TouchableOpacity key={t} style={[styles.filtroBtn, filtro===t && styles.filtroBtnAtivo]} onPress={() => setFiltro(t)}>
            <Text style={[styles.filtroTexto, filtro===t && {color:"#0a0f1e"}]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.filtroBtn, mostrarRaios && styles.filtroBtnAtivo]} onPress={() => setMostrarRaios(!mostrarRaios)}>
          <Text style={[styles.filtroTexto, mostrarRaios && {color:"#0a0f1e"}]}>Raios</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.contador}>
        <Text style={styles.contadorTexto}>{antenasFiltradas.length} antenas num raio de 5km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:"#0a0f1e" },
  mapa: { flex:1 },
  loading: { flex:1, backgroundColor:"#0a0f1e", alignItems:"center", justifyContent:"center", gap:16 },
  loadingTexto: { color:"#8899aa", fontSize:16 },
  filtros: { position:"absolute", top:10, left:10, right:10, maxHeight:44 },
  filtroBtn: { backgroundColor:"#111827cc", borderWidth:1, borderColor:"#1a2540", borderRadius:20, paddingHorizontal:14, paddingVertical:8, marginRight:8 },
  filtroBtnAtivo: { backgroundColor:"#00d4ff" },
  filtroTexto: { color:"#fff", fontSize:12, fontWeight:"600" },
  contador: { position:"absolute", bottom:20, left:16, backgroundColor:"#111827cc", borderRadius:12, paddingHorizontal:12, paddingVertical:6 },
  contadorTexto: { color:"#8899aa", fontSize:12 },
});
