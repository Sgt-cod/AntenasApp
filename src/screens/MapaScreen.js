import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

const RAIO = { "5G":500, "4G":2000, "3G":5000, "2G":10000 };
const COR = { "5G":"#00ff88", "4G":"#00d4ff", "3G":"#ffaa00", "2G":"#ff6600" };

export default function MapaScreen() {
  const [localizacao, setLocalizacao] = useState(null);
  const [antenas, setAntenas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  const [filtro, setFiltro] = useState("Todas");
  const [mostrarRaios, setMostrarRaios] = useState(true);
  const mapRef = useRef(null);

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
    return Array.from({ length:30 }, (_, i) => {
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

  function irParaMim() {
    if (localizacao && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800);
    }
  }

  const filtradas = filtro === "Todas" ? antenas : antenas.filter(a => a.tecnologia === filtro);

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
      <MapView
        ref={mapRef}
        style={styles.mapa}
        initialRegion={{
          latitude: localizacao?.latitude || -15.7801,
          longitude: localizacao?.longitude || -47.9292,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {filtradas.map((a) => (
          <Marker
            key={a.id}
            coordinate={{ latitude: a.latitude, longitude: a.longitude }}
            onPress={() => setSelecionada(a)}
          >
            <View style={[styles.marcador, { borderColor: COR[a.tecnologia] || "#fff" }]}>
              <Text style={[styles.marcadorTexto, { color: COR[a.tecnologia] || "#fff" }]}>{a.tecnologia}</Text>
            </View>
          </Marker>
        ))}
        {mostrarRaios && filtradas.map((a) => (
          <Circle
            key={"r" + a.id}
            center={{ latitude: a.latitude, longitude: a.longitude }}
            radius={a.raio}
            strokeColor={(COR[a.tecnologia] || "#fff") + "88"}
            fillColor={(COR[a.tecnologia] || "#fff") + "15"}
            strokeWidth={1}
          />
        ))}
      </MapView>

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

      <TouchableOpacity style={styles.btnLoc} onPress={irParaMim}>
        <Ionicons name="navigate" size={22} color="#00d4ff" />
      </TouchableOpacity>

      <View style={styles.contador}>
        <Text style={styles.contadorTexto}>{filtradas.length} antenas</Text>
      </View>

      <Modal visible={!!selecionada} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setSelecionada(null)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTec, { color: COR[selecionada?.tecnologia] || "#fff" }]}>{selecionada?.tecnologia}</Text>
              <Text style={styles.modalOp}>{selecionada?.operadora}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Frequencia</Text>
              <Text style={styles.modalValor}>{selecionada?.frequencia}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Raio estimado</Text>
              <Text style={styles.modalValor}>
                {selecionada?.raio >= 1000 ? (selecionada.raio/1000).toFixed(1)+" km" : selecionada?.raio+"m"}
              </Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Coordenadas</Text>
              <Text style={styles.modalValor}>{selecionada?.latitude?.toFixed(5)}, {selecionada?.longitude?.toFixed(5)}</Text>
            </View>
            <Text style={styles.modalFechar}>Toque fora para fechar</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:"#0a0f1e" },
  mapa: { flex:1 },
  loading: { flex:1, backgroundColor:"#0a0f1e", alignItems:"center", justifyContent:"center", gap:16 },
  loadingTexto: { color:"#8899aa", fontSize:16 },
  marcador: { backgroundColor:"#0a0f1ecc", borderWidth:2, borderRadius:8, paddingHorizontal:6, paddingVertical:2 },
  marcadorTexto: { fontSize:10, fontWeight:"bold" },
  filtros: { position:"absolute", top:10, left:10, right:10, maxHeight:44 },
  filtroBtn: { backgroundColor:"#111827cc", borderWidth:1, borderColor:"#1a2540", borderRadius:20, paddingHorizontal:14, paddingVertical:8, marginRight:8 },
  filtroBtnAtivo: { backgroundColor:"#00d4ff" },
  filtroTexto: { color:"#fff", fontSize:12, fontWeight:"600" },
  btnLoc: { position:"absolute", bottom:100, right:16, backgroundColor:"#111827", borderRadius:30, padding:14, borderWidth:1, borderColor:"#1a2540" },
  contador: { position:"absolute", bottom:100, left:16, backgroundColor:"#111827cc", borderRadius:12, paddingHorizontal:12, paddingVertical:6 },
  contadorTexto: { color:"#8899aa", fontSize:12 },
  overlay: { flex:1, justifyContent:"flex-end", backgroundColor:"#00000066" },
  modalCard: { backgroundColor:"#111827", borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, borderTopWidth:1, borderColor:"#1a2540" },
  modalHeader: { flexDirection:"row", alignItems:"center", gap:12, marginBottom:20 },
  modalTec: { fontSize:32, fontWeight:"bold" },
  modalOp: { color:"#fff", fontSize:20, fontWeight:"600" },
  modalRow: { flexDirection:"row", justifyContent:"space-between", paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#1a2540" },
  modalLabel: { color:"#8899aa", fontSize:14 },
  modalValor: { color:"#fff", fontSize:14, fontWeight:"600" },
  modalFechar: { color:"#556", fontSize:12, textAlign:"center", marginTop:16 },
});