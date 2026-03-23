import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import * as Location from "expo-location";
import MapaScreen from "./src/screens/MapaScreen";
import SinalScreen from "./src/screens/SinalScreen";
import HistoricoScreen from "./src/screens/HistoricoScreen";

const Tab = createBottomTabNavigator();

const erros = [];
const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  erros.push({ message: error.message, stack: error.stack, isFatal });
  originalHandler(error, isFatal);
});

export default function App() {
  const [pronto, setPronto] = useState(false);
  const [erroVisivel, setErroVisivel] = useState(null);

  useEffect(() => {
    async function init() {
      try { await Location.requestForegroundPermissionsAsync(); } catch(e) {}
      setPronto(true);
    }
    init();

    const interval = setInterval(() => {
      if (erros.length > 0) {
        setErroVisivel(erros[erros.length - 1]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (erroVisivel) {
    return (
      <ScrollView style={{ flex:1, backgroundColor:"#0a0f1e", padding:20, paddingTop:50 }}>
        <Text style={{ color:"#ff4444", fontSize:16, fontWeight:"bold", marginBottom:10 }}>
          ERRO CAPTURADO:
        </Text>
        <Text style={{ color:"#fff", fontSize:12, marginBottom:10 }}>
          {erroVisivel.message}
        </Text>
        <Text style={{ color:"#8899aa", fontSize:10 }}>
          {erroVisivel.stack}
        </Text>
      </ScrollView>
    );
  }

  if (!pronto) {
    return (
      <View style={{ flex:1, backgroundColor:"#0a0f1e", alignItems:"center", justifyContent:"center", gap:16 }}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={{ color:"#8899aa", fontSize:16 }}>Iniciando Antenas BR...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            const icons = { Mapa:"map-outline", Sinal:"cellular-outline", Historico:"time-outline" };
            return <Ionicons name={icons[route.name] || "apps"} size={size} color={color} />;
          },
          tabBarStyle: { backgroundColor:"#0a0f1e", borderTopColor:"#1a2540" },
          tabBarActiveTintColor: "#00d4ff",
          tabBarInactiveTintColor: "#445566",
          headerStyle: { backgroundColor:"#0a0f1e" },
          headerTintColor: "#00d4ff",
          headerTitleStyle: { fontWeight:"bold" },
        })}
      >
        <Tab.Screen name="Mapa" component={MapaScreen} options={{ title:"Mapa de Antenas" }} />
        <Tab.Screen name="Sinal" component={SinalScreen} options={{ title:"Sinal Atual" }} />
        <Tab.Screen name="Historico" component={HistoricoScreen} options={{ title:"Historico" }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
          }
