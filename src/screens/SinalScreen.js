import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Cellular from "expo-cellular";
import * as Location from "expo-location";
import { initDB, salvarConexao } from "../database/db";

export default function SinalScreen() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    try { initDB(); } catch(e) {}
    atualizar();
  }, []);

  async function atualizar() {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = {};
      try { resultado.operadora = await Cellular.getCarrierNameAsync(); } catch(e) { resultado.operadora = "Nao disponivel"; }
      try {
        const tec = await Cellular.getCellularGenerationAsync();
        const labels = { 0:"Desconhecido", 1:"2G", 2:"3G", 3:"4G", 4:"5G" };
        resultado.tecnologia = labels[tec] ?? "Desconhecido";
        resultado.dadosMoveis = tec !== null && tec !== undefined && tec >= 1;
      } catch(e) { resultado.tecnologia = "Desconhecido"; resultado.dadosMoveis = false; }
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          resultado.latitude = loc.coords.latitude;
          resultado.longitude = loc.coords.longitude;
          resultado.precisao = loc.coords.accuracy?.toFixed(0);
        }
      } catch(e) { resultado.latitude = null; resultado.longitude = null; }
      try { salvarConexao(resultado); } catch(e) {}
      setDados(resultado);
      setUltimaAtualizacao(new Date().toLocaleTimeString("pt-BR"));
    } catch(e) { setErro("Erro: " + e.message); }
    setCarregando(false);
  }

  const corTec = { "5G":"#00ff88", "4G":"#00d4ff", "3G":"#ffaa00", "2G":"#ff6600", "Desconhecido":"#666" };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Conexao Atual</Text>
        {carregando ? (
          <ActivityIndicator size="large" color="#00d4ff" style={{ marginTop:30 }} />
        ) : erro ? (
          <Text style={styles.erroTexto}>{erro}</Text>
        ) : dados ? (
          <>
            <View style={styles.badgeTec}>
              <Text style={[styles.tecnologia, { color: corTec[dados.tecnologia] || "#fff" }]}>
                {dados.tecnologia || "?"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#00d4ff" />
              <Text style={styles.label}>Operadora</Text>
              <Text style={styles.valor}>{dados.operadora || "---"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="cellular-outline" size={20} color="#00d4ff" />
              <Text style={styles.label}>Dados moveis</Text>
              <Text style={[styles.valor, { color: dados.dadosMoveis ? "#00ff88" : "#ff4444" }]}>
                {dados.dadosMoveis ? "Ativo" : "Inativo"}
              </Text>
            </View>
            {dados.latitude ? (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#00d4ff" />
                <Text style={styles.label}>Localizacao</Text>
                <Text style={styles.valor}>{dados.latitude.toFixed(5)}, {dados.longitude.toFixed(5)}</Text>
              </View>
            ) : null}
            {dados.precisao ? (
              <View style={styles.infoRow}>
                <Ionicons name="radio-outline" size={20} color="#00d4ff" />
                <Text style={styles.label}>Precisao GPS</Text>
                <Text style={styles.valor}>+/-{dados.precisao}m</Text>
              </View>
            ) : null}
            {ultimaAtualizacao ? <Text style={styles.atualizacao}>Atualizado as {ultimaAtualizacao}</Text> : null}
          </>
        ) : (
          <Text style={styles.erroTexto}>Toque em Atualizar para comecar</Text>
        )}
      </View>
      <TouchableOpacity style={styles.botao} onPress={atualizar} disabled={carregando}>
        <Ionicons name="refresh" size={20} color="#0a0f1e" />
        <Text style={styles.botaoTexto}>Atualizar Sinal</Text>
      </TouchableOpacity>
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color="#556" />
        <Text style={styles.infoTexto}>Cada atualizacao registra automaticamente no historico com sua localizacao GPS.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:"#0a0f1e", padding:16 },
  card: { backgroundColor:"#111827", borderRadius:16, padding:20, marginBottom:16, borderWidth:1, borderColor:"#1a2540" },
  titulo: { color:"#fff", fontSize:18, fontWeight:"bold", marginBottom:20, textAlign:"center" },
  badgeTec: { alignItems:"center", marginBottom:24 },
  tecnologia: { fontSize:48, fontWeight:"bold" },
  infoRow: { flexDirection:"row", alignItems:"center", paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#1a2540" },
  label: { color:"#8899aa", fontSize:14, marginLeft:10, flex:1 },
  valor: { color:"#fff", fontSize:14, fontWeight:"600" },
  atualizacao: { color:"#556", fontSize:12, textAlign:"center", marginTop:16 },
  erroTexto: { color:"#ff4444", textAlign:"center", marginTop:20, padding:10 },
  botao: { backgroundColor:"#00d4ff", borderRadius:12, padding:16, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, marginBottom:16 },
  botaoTexto: { color:"#0a0f1e", fontWeight:"bold", fontSize:16 },
  infoCard: { backgroundColor:"#111827", borderRadius:12, padding:14, flexDirection:"row", alignItems:"center", gap:8, borderWidth:1, borderColor:"#1a2540", marginBottom:30 },
  infoTexto: { color:"#556", fontSize:12, flex:1 },
});