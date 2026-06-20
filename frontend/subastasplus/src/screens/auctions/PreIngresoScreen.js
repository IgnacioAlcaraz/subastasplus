import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { useAuth } from "../../context/AuthContext";
import { getSala } from "../../api/subastas";

export default function PreIngresoScreen({ navigation, route }) {
  const { subasta } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // el backend nos dice si puede entrar y por qué no; acá descomponemos la razón para mostrar cada check
  const categoriaOK =
    subasta.puedeEntrar || subasta.razonNoEntrar !== "Categoría insuficiente";
  const medioPagoOK =
    subasta.puedeEntrar || subasta.razonNoEntrar === "Categoría insuficiente";
  const puedeEntrar = categoriaOK && medioPagoOK;

  async function handleEntrar() {
    setLoading(true);
    try {
      const sala = await getSala(subasta.id);
      navigation.navigate("Sala", {
        sala,
        subastaId: subasta.id,
        titulo: subasta.titulo,
        moneda: subasta.moneda,
      });
    } catch (error) {
      if (error.status === 409 && error.data?.code === "MEDIO_PAGO_REQUERIDO") {
        navigation.navigate("PreIngresoMedioPago", {
          subastaId: subasta.id,
          titulo: subasta.titulo,
          moneda: error.data?.details?.moneda || subasta.moneda,
          medios: error.data?.details?.medios || [],
        });
      } else {
        Alert.alert("No podés ingresar", error.message || "Error al acceder a la sala.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>← Acceso a subasta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contenido}>
        <Text style={styles.seccionTitulo}>Verificación de acceso</Text>

        <View style={styles.card}>
          <View style={styles.fila}>
            <Text style={styles.label}>Subasta</Text>
            <Text style={styles.valor}>{subasta.titulo}</Text>
          </View>
          <View style={styles.separador} />
          <View style={styles.fila}>
            <Text style={styles.label}>Cat. requerida</Text>
            <Text style={styles.valor}>{capitalize(subasta.categoria)}</Text>
          </View>
          <View style={styles.separador} />
          <View style={styles.fila}>
            <Text style={styles.label}>Tu categoría</Text>
            <View style={styles.filaValor}>
              <Text style={styles.valor}>{capitalize(user?.categoria || "-")}</Text>
              <Text style={[styles.badge, categoriaOK ? styles.badgeOK : styles.badgeKO]}>
                {categoriaOK ? "OK" : "✗"}
              </Text>
            </View>
          </View>
          <View style={styles.separador} />
          <View style={styles.fila}>
            <Text style={styles.label}>Medio de pago</Text>
            <View style={styles.filaValor}>
              <Text style={styles.valor}>Verificado</Text>
              <Text style={[styles.badge, medioPagoOK ? styles.badgeOK : styles.badgeKO]}>
                {medioPagoOK ? "OK" : "✗"}
              </Text>
            </View>
          </View>
        </View>

        {!puedeEntrar && (
          <Text style={styles.errorTexto}>{subasta.razonNoEntrar}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.boton, (!puedeEntrar || loading) && styles.botonDisabled]}
          onPress={handleEntrar}
          disabled={!puedeEntrar || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.botonTexto}>Entrar a la subasta</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backTexto: { ...typography.body, color: colors.textPrimary, fontWeight: "600" },
  contenido: { flex: 1, padding: 20 },
  seccionTitulo: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  filaValor: { flexDirection: "row", alignItems: "center", gap: 8 },
  separador: { height: 1, backgroundColor: colors.border },
  label: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  valor: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: "500" },
  badge: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  badgeOK: { backgroundColor: "#D1FAE5", color: "#065F46" },
  badgeKO: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  errorTexto: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: 16,
    textAlign: "center",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  boton: {
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  botonDisabled: { backgroundColor: colors.textDisabled },
  botonTexto: { ...typography.button, color: colors.surface },
});
