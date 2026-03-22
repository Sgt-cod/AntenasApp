import { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { buscarHistorico, limparHistorico, initDB } from "../database/db";

export default function HistoricoScreen() {
  const [historico, setHistorico] = useState([]);

  useFocusEffect(
    useCallback(() => {
      try { initDB(); } catch(e) {}
      carregar();
    }, [])
  );

  function carregar() {
    try {
      const dados = buscarHistorico();
      setHistorico(dados || []);
    } catch(e) { setHistorico([]); }
  }

  function confirmarLimpar() {
    Alert.alert("Limpar Historico", "Deseja apagar todo o historico?", [
      { text:"Cancelar", style:"cancel" },
      { text:"Apagar", style:"destructive", onPress: () => { limparHistorico(); carregar(); } },
    ]);
  }

  const corTec = { "5G":"#00ff88", "4G":"#00d4ff", "3G":"#ffaa00", "2G":"#ff6600" };

  function formatarData(iso) {
    try { return new Date(iso).toLocaleString("pt-BR"); } catch(e) { return iso; }
  }

  function renderItem({ item }) {
    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={[styles.tec, { color: corTec[item.tecnologia] || "#fff" }]}>{item.tecnologia}</Text>
          <Text style={styles.operadora}>{item.operadora}</Text>
          <Text style={styles.data}>{formatarData(item.timestamp)}</Text>
        </View>
        {item.latitude !== 0 && item.latitude ? (
          <View style={styles.itemFooter}>
            <Ionicons name="location" size={13} color="#556" />
            <Text style={styles.coords}>{Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>{historico.length} registro{historico.length !== 1 ? "s" : ""}</Text>
        {historico.length > 0 ? (
          <TouchableOpacity onPress={confirmarLimpar}>
            <Ionicons name="trash" size={22} color="#ff4444" />
          </TouchableOpacity>
        ) : null}
      </View>
      {historico.length === 0 ? (
        <View style={styles.vazio}>
          <Ionicons name="time-outline" size={60} color="#1a2540" />
          <Text style={styles.vazioTexto}>Nenhum registro ainda</Text>
          <Text style={styles.vazioSub}>Va ate a aba Sinal e toque em Atualizar</Text>
        </View>
      ) : (
        <FlatList
          data={historico}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom:20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:"#0a0f1e", padding:16 },
  header: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:16 },
  titulo: { color:"#8899aa", fontSize:14 },
  item: { backgroundColor:"#111827", borderRadius:12, padding:14, marginBottom:10, borderWidth:1, borderColor:"#1a2540" },
  itemHeader: { flexDirection:"row", alignItems:"center", gap:10 },
  tec: { fontWeight:"bold", fontSize:16, width:40 },
  operadora: { color:"#fff", fontSize:14, flex:1 },
  data: { color:"#556", fontSize:12 },
  itemFooter: { flexDirection:"row", alignItems:"center", gap:4, marginTop:8 },
  coords: { color:"#556", fontSize:12 },
  vazio: { flex:1, alignItems:"center", justifyContent:"center", gap:10 },
  vazioTexto: { color:"#1a2540", fontSize:18, fontWeight:"bold" },
  vazioSub: { color:"#556", fontSize:14, textAlign:"center" },
});