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
import { useAuth } from "../../context/AuthContext";
import { getPerfil } from "../../api/perfil";
import { getMediosPago } from "../../api/mediosPago";
import { getSubastas } from "../../api/subastas";

function formatFecha(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export default function HomeScreen({ navigation }) {
  const { status } = useAuth();
  const isGuest = status === 'pending';

  const [perfil, setPerfil] = useState(null);
  const [medios, setMedios] = useState([]);
  const [subastasEnVivo, setSubastasEnVivo] = useState([]);
  const [proximasSubastas, setProximasSubastas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        if (isGuest) {
          const [datosEnVivo, datosProximas] = await Promise.all([
            getSubastas("en_vivo"),
            getSubastas("programada"),
          ]);
          setSubastasEnVivo(datosEnVivo.data);
          setProximasSubastas(datosProximas.data);
        } else {
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
        }
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
              <Text style={styles.saludo}>
                {isGuest ? "Bienvenido" : `Hola, ${perfil?.nombre ?? "..."}`}
              </Text>
              <Text style={styles.headerTitulo}>SubastaPlus</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.campana}>🔔</Text>
            </TouchableOpacity>
          </View>
          {!isGuest && (
            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Cat: {perfil?.categoria ?? "-"}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{medios.length} medios</Text>
              </View>
            </View>
          )}
        </View>

        {isGuest && (
          <View style={styles.banner}>
            <Text style={styles.bannerTexto}>
              Tu cuenta está siendo revisada. Te avisaremos cuando sea aprobada.
            </Text>
          </View>
        )}

        {enVivoFiltradas.length > 0 && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>En vivo ahora</Text>
            <FlatList
              data={enVivoFiltradas}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.cardEnVivo}>
                  <Text style={styles.cardTitulo}>{item.titulo}</Text>
                  <Text style={styles.cardSub}>
                    {item.cantidadPiezas} piezas · {item.categoria}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.badgeMoneda}>
                      <Text style={styles.badgeMonedaTexto}>{item.moneda}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.botonEntrar}
                      onPress={() => navigation.navigate("Auctions", {
                        screen: "AuctionDetail",
                        params: { id: item.id },
                      })}
                    >
                      <Text style={styles.botonEntrarTexto}>Entrar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
              <TouchableOpacity style={styles.cardProxima}>
                <View style={styles.cardProximaImagen} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Programada</Text>
                </View>
                <Text style={styles.cardTitulo}>{item.titulo}</Text>
                <Text style={styles.cardFecha}>{formatFecha(item.fecha)}</Text>
              </TouchableOpacity>
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
  cardEnVivo: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    width: 280,
    marginRight: 12,
  },
  cardTitulo: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeMoneda: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeMonedaTexto: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  botonEntrar: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  botonEntrarTexto: {
    ...typography.button,
    color: colors.surface,
  },
  cardProxima: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    width: 160,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardProximaImagen: {
    backgroundColor: colors.border,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardFecha: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  banner: {
    backgroundColor: colors.warning,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bannerTexto: {
    ...typography.bodySmall,
    color: colors.surface,
    textAlign: 'center',
  },
});
