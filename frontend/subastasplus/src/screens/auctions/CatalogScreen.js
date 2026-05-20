import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography } from "../../constants";
import { getCatalogo } from "../../api/subastas";

export default function CatalogScreen({ navigation, route }) {
  const { subastaId, moneda } = route.params;
  const [piezas, setPiezas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const piezasFiltradas = piezas.filter(
    (p) =>
      p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(p.numeroItem).includes(busqueda)
  );

  useEffect(() => {
    async function cargarCatalogo() {
      try {
        const datos = await getCatalogo(subastaId);
        setPiezas(datos.data);
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar el catálogo");
      } finally {
        setLoading(false);
      }
    }

    cargarCatalogo();
  }, [subastaId]);

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>← Catálogo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buscadorContainer}>
        <TextInput
          style={styles.buscador}
          placeholder="Buscar pieza..."
          placeholderTextColor={colors.textDisabled}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <FlatList
        data={piezasFiltradas}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("PieceDetail", { id: item.id, moneda })}
          >
            <View style={styles.imagen} />
            <View style={styles.cardInfo}>
              <Text style={styles.numero}>#{item.numeroItem}</Text>
              <Text style={styles.descripcion}>{item.descripcion}</Text>
              {item.precioBase !== null && (
                <Text style={styles.precio}>
                  {moneda} {item.precioBase.toLocaleString()}
                </Text>
              )}
            </View>
            <Text style={styles.flecha}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.vacio}>
            {busqueda ? "Sin resultados para esa búsqueda" : "No hay piezas en este catálogo"}
          </Text>
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
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backTexto: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  buscadorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  buscador: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...typography.body,
    color: colors.textPrimary,
  },
  lista: {
    padding: 20,
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  imagen: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  cardInfo: {
    flex: 1,
  },
  numero: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  descripcion: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 4,
  },
  precio: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  flecha: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  vacio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
});
