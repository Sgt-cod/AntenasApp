import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import MapaScreen from "./src/screens/MapaScreen";
import SinalScreen from "./src/screens/SinalScreen";
import HistoricoScreen from "./src/screens/HistoricoScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    async function init() {
      try { await Location.requestForegroundPermissionsAsync(); } catch(e) {}
      setPronto(true);
    }
    init();
  }, []);

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