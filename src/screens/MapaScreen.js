import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";

const RAIO = { "5G":500, "4G":2000, "3G":5000, "2G":10000 };
const COR = { "5G":"#00ff88", "4G":"#00d4ff", "3G":"#ffaa00", "2G":"#ff6600" };

export default function MapaScreen() {
  const [localizacao, setLocalizacao] = useState(null);
  const [antenas, setAntenas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  const [filtro, setFiltro] = useState("Todas");
  const [mostrarRaios, setMostrarRaios] = useState(true);

  useEffect(() => { iniciar(); }, []);

  async function iniciar() {
    setCarregando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocalizacao(loc.coords);
        setAntenas(gerarDemo(loc.coords.latitude, loc.coords.longitude));
      }
    } catch(e) {}
    setCarregando(false);
  }

  function gerarDemo(lat, lon) {
    const ops = ["Claro","Vivo","TIM","Oi"];
    const tecs = ["5G","4G","4G","4G","3G","3G","2G"];
    return Array.from({ length:20 }, (_, i) => {
      const tec = tecs[Math.floor(Math.random() * tecs.length)];
      return {
        id: i,
        latitude: lat + (Math.random() - 0.5) * 0.05,
        longitude: lon + (Math.random() - 0.5) * 0.05,
        operadora: ops[Math.floor(Math.random() * ops.length)],
        tecnologia: tec,
        raio: RAIO[tec],
        frequencia: tec === "5G" ? "3500 MHz" : tec === "4G" ? "1800 MHz" : "900 MHz",
      };
    });
  }

  const filtradas = filtro === "Todas" ? antenas : antenas.filter(a => a.tecnologia === filtro);

  function gerarHTML() {
    const lat = localizacao?.latitude || -15.7801;
    const lon = localizacao?.longitude || -47.9292;
    const marcadores = filtradas.map(a => `
      L.circleMarker([${a.latitude}, ${a.longitude}], {
        radius: 8, color: "${COR[a.tecnologia] || "#fff"}", fillColor: "${COR[a.tecnologia] || "#fff"}", fillOpacity: 0.8
      }).addTo(map).bindPopup("<b>${a.tecnologia}</b><br>${a.operadora}<br>${a.frequencia}");
      ${mostrarRaios ? `L.circle([${a.latitude}, ${a.longitude}], { radius: ${a.raio}, color: "${COR[a.tecnologia] || "#fff"}", fillOpacity: 0.05, weight: 1 }).addTo(map);` : ""}
    `).join("");
    return `<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>body{margin:0;padding:0;}#map{width:100%;height:100vh;background:#0a0f1e;}</style>
    </head><body>
      <div id="map"></div>
      <script>
        var map = L.map("map", { zoomControl: true }).setView([${lat}, ${lon}], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "OpenStreetMap", maxZoom: 19
        }).addTo(map);
        L.circleMarker([${lat}, ${lon}], { radius: 10, color: "#fff", fillColor: "#00d4ff", fillOpacity: 1 }).addTo(map).bindPopup("Voce esta aqui");
        ${marcadores}
      </script>
    </body></html>`;
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingTexto}>Carregando mapa...</Text>
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
          <TouchableOpacity key={t} style={[styles.filtroBtn, filtro === t && styles.filtroBtnAtivo]} onPress={() => setFiltro(t)}>
            <Text style={[styles.filtroTexto, filtro === t && { color:"#0a0f1e" }]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.filtroBtn, mostrarRaios && styles.filtroBtnAtivo]} onPress={() => setMostrarRaios(!mostrarRaios)}>
          <Text style={[styles.filtroTexto, mostrarRaios && { color:"#0a0f1e" }]}>Raios</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.contador}>
        <Text style={styles.contadorTexto}>{filtradas.length} antenas</Text>
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
