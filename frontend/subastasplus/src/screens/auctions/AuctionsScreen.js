import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography } from "../../constants";
import { getSubastas } from "../../api/subastas";

function formatFecha(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function CardSubasta({ item, onEntrar }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.estado === "en_vivo" ? (
          <View style={styles.badgeEnVivo}>
            <Text style={styles.badgeEnVivoTexto}>● EN VIVO</Text>
          </View>
        ) : (
          <Text style={styles.cardFecha}>{formatFecha(item.fecha)}</Text>
        )}
      </View>
      <Text style={styles.cardTitulo}>{item.titulo}</Text>
      <Text style={styles.cardSub}>
        {item.cantidadPiezas} pzs · {item.categoria}
      </Text>
      <View style={styles.cardFooter}>
        <View style={styles.badgeMoneda}>
          <Text style={styles.badgeMonedaTexto}>{item.moneda}</Text>
        </View>
        {item.estado !== "finalizada" && (
          <TouchableOpacity style={styles.botonEntrar} onPress={onEntrar}>
            <Text style={styles.botonEntrarTexto}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AuctionsScreen({ navigation }) {
  const [tabActivo, setTabActivo] = useState("en_vivo");
  const [subastasAbiertas, setSubastasAbiertas] = useState([]);
  const [subastasFinalizadas, setSubastasFinalizadas] = useState([]);
  const [loading, setLoading] = useState(true);

  const subastasVisibles =
    tabActivo === "finalizada"
      ? subastasFinalizadas
      : subastasAbiertas.filter((s) => s.estado === tabActivo);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [datosAbiertas, datosFinalizadas] = await Promise.all([
          getSubastas("en_vivo"),
          getSubastas("finalizada"),
        ]);
        setSubastasAbiertas(datosAbiertas.data);
        setSubastasFinalizadas(datosFinalizadas.data);
      } catch (error) {
        Alert.alert("Error", "No se pudieron cargar las subastas");
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Subastas</Text>
      </View>

      <View style={styles.tabs}>
        {["en_vivo", "programada", "finalizada"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, tabActivo === tab && styles.tabActivo]}
            onPress={() => setTabActivo(tab)}
          >
            <Text style={[styles.tabTexto, tabActivo === tab && styles.tabTextoActivo]}>
              {tab === "en_vivo"
                ? "En vivo"
                : tab === "programada"
                ? "Programadas"
                : "Finalizadas"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={subastasVisibles}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <CardSubasta
            item={item}
            onEntrar={() => navigation.navigate("AuctionDetail", { id: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.vacio}>No hay subastas en esta categoría</Text>
        }
      />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titulo: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabTexto: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabTextoActivo: {
    color: colors.surface,
    fontWeight: "600",
  },
  lista: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    marginBottom: 8,
  },
  badgeEnVivo: {
    alignSelf: "flex-start",
  },
  badgeEnVivoTexto: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  cardFecha: {
    ...typography.caption,
    color: colors.textSecondary,
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
    marginBottom: 12,
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonEntrarTexto: {
    ...typography.button,
    color: colors.surface,
  },
  vacio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
});
