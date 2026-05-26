import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { getSubastaById } from "../../api/subastas";
import GuestModal from "../../components/common/GuestModal";

function formatFecha(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatHora(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs";
}

export default function AuctionDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { status, isGuest, exitGuest } = useAuth();
  const [subasta, setSubasta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function cargarSubasta() {
      try {
        const datos = await getSubastaById(id);
        setSubasta(datos);
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar la subasta");
      } finally {
        setLoading(false);
      }
    }

    cargarSubasta();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!subasta) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>← Detalle subasta</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.titulo}>{subasta.titulo}</Text>
        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>{subasta.categoria}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>{subasta.moneda}</Text>
          </View>
        </View>

        <View style={styles.infoTabla}>
          <View style={styles.infoFila}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValor}>{formatFecha(subasta.fecha)}</Text>
          </View>
          <View style={styles.infoFila}>
            <Text style={styles.infoLabel}>Hora</Text>
            <Text style={styles.infoValor}>{formatHora(subasta.fecha)}</Text>
          </View>
          {subasta.ubicacion && (
            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={[styles.infoValor, styles.infoLink]}>{subasta.ubicacion}</Text>
            </View>
          )}
          {subasta.rematador && (
            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>Rematador</Text>
              <Text style={styles.infoValor}>{subasta.rematador}</Text>
            </View>
          )}
        </View>

        <View style={styles.separador} />

        <Text style={styles.catalogoTitulo}>
          Catálogo: {subasta.cantidadPiezas} piezas
        </Text>

        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() => navigation.navigate("Catalog", {
            subastaId: subasta.id,
            moneda: subasta.moneda,
          })}
        >
          <Text style={styles.botonSecundarioTexto}>Ver catálogo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonPrimario}
          onPress={() => {
            if (isGuest) setModalVisible(true);
          }}
        >
          <Text style={styles.botonPrimarioTexto}>Entrar a subasta</Text>
        </TouchableOpacity>
      </ScrollView>

      <GuestModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        variant={status}
        onLogin={() => { setModalVisible(false); exitGuest('Login'); }}
        onRegister={() => { setModalVisible(false); exitGuest('Register'); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backTexto: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  contenido: {
    padding: 20,
  },
  titulo: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeTexto: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  infoTabla: {
    gap: 14,
    marginBottom: 24,
  },
  infoFila: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValor: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  infoLink: {
    color: colors.primary,
  },
  separador: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 24,
  },
  catalogoTitulo: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  botonSecundario: {
    backgroundColor: colors.textSecondary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  botonSecundarioTexto: {
    ...typography.button,
    color: colors.surface,
  },
  botonPrimario: {
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  botonPrimarioTexto: {
    ...typography.button,
    color: colors.surface,
  },
});
