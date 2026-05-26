import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography } from "../../constants";
import { getPerfil } from "../../api/perfil";
import { getMediosPago } from "../../api/mediosPago";
import { getSubastas } from "../../api/subastas";
import AuctionCard from "../../components/common/AuctionCard";

export default function HomeScreen({ navigation }) {
  const [perfil, setPerfil] = useState(null);
  const [medios, setMedios] = useState([]);
  const [subastasEnVivo, setSubastasEnVivo] = useState([]);
  const [proximasSubastas, setProximasSubastas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [datosPerfil, datosMedios, datosEnVivo, datosProximas] = await Promise.all([
          getPerfil(),
          getMediosPago(),
          getSubastas("en_vivo"),
          getSubastas("programada"),
        ]);
        setPerfil(datosPerfil);
        setMedios(datosMedios);
        setSubastasEnVivo(datosEnVivo.data);
        setProximasSubastas(datosProximas.data);
      } catch (error) {
        Alert.alert("Error", "No se pudieron cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const enVivoFiltradas = subastasEnVivo.filter((s) => s.estado === "en_vivo");
  const proximasFiltradas = proximasSubastas.filter((s) => s.estado === "programada");

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.saludo}>Hola, {perfil?.nombre ?? "..."}</Text>
              <Text style={styles.headerTitulo}>SubastaPlus</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.campana}>🔔</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Cat: {perfil?.categoria ?? "-"}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{medios.length} medios</Text>
            </View>
          </View>
        </View>

        {enVivoFiltradas.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>En vivo ahora</Text>
            <FlatList
              data={enVivoFiltradas}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <AuctionCard
                  subasta={item}
                  variant="featured"
                  onPress={() => navigation.navigate("Auctions", {
                    screen: "AuctionDetail",
                    params: { id: item.id },
                  })}
                />
              )}
            />
          </View>
        )}

        {proximasFiltradas.length > 0 && (
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Próximas</Text>
          <FlatList
            data={proximasFiltradas}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <AuctionCard
                subasta={item}
                variant="compact"
                onPress={() => navigation.navigate("Auctions", {
                  screen: "AuctionDetail",
                  params: { id: item.id },
                })}
              />
            )}
          />
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primaryDark,
    padding: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  saludo: {
    ...typography.bodySmall,
    color: colors.secondary,
  },
  headerTitulo: {
    ...typography.h2,
    color: colors.surface,
  },
  campana: {
    fontSize: 22,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    ...typography.caption,
    color: colors.surface,
  },
  seccion: {
    padding: 20,
  },
  seccionTitulo: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 12,
  },
});
