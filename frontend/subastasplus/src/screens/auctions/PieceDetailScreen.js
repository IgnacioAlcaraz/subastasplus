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
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography } from "../../constants";
import { getPiezaById } from "../../api/piezas";
import { SERVER_URL } from "../../api/client";

function formatFechaSubasta(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return (
    date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" }) +
    ", " +
    date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) +
    " hs"
  );
}

function Carrusel({ imagenes, imagenActiva, onCambio }) {
  const ancho = Dimensions.get("window").width;

  if (imagenes.length === 0) {
    return <View style={[styles.imagenPlaceholder, { width: ancho }]} />;
  }

  return (
    <View>
      <FlatList
        data={imagenes}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / ancho);
          onCambio(index);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: `${SERVER_URL}${item}` }}
            style={{ width: ancho, height: 260 }}
            resizeMode="contain"
          />
        )}
      />
      <View style={styles.dots}>
        {imagenes.map((_, i) => (
          <View key={i} style={[styles.dot, i === imagenActiva && styles.dotActivo]} />
        ))}
      </View>
    </View>
  );
}

export default function PieceDetailScreen({ navigation, route }) {
  const { id, moneda = "US$" } = route.params;
  const [pieza, setPieza] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagenActiva, setImagenActiva] = useState(0);

  useEffect(() => {
    async function cargarPieza() {
      try {
        const datos = await getPiezaById(id);
        setPieza(datos);
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar la pieza");
      } finally {
        setLoading(false);
      }
    }

    cargarPieza();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!pieza) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <Carrusel
          imagenes={pieza.imagenes}
          imagenActiva={imagenActiva}
          onCambio={setImagenActiva}
        />

        <View style={styles.contenido}>
          {pieza.esObraDeArte && (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>Obra de arte</Text>
            </View>
          )}

          <Text style={styles.titulo}>{pieza.descripcion}</Text>
          <Text style={styles.subtitulo}>
            #{pieza.numeroItem}
            {pieza.artista ? ` · ${pieza.artista.nombre}` : ""}
          </Text>

          {pieza.precioBase !== null && (
            <View style={styles.precioContainer}>
              <Text style={styles.precioLabel}>Precio base</Text>
              <Text style={styles.precio}>{moneda} {pieza.precioBase.toLocaleString()}</Text>
            </View>
          )}

          {pieza.artista?.historia ? (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Historia</Text>
              <Text style={styles.seccionTexto}>{pieza.artista.historia}</Text>
            </View>
          ) : null}

          {pieza.subastaAsignada && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Subasta asignada</Text>
              <Text style={styles.seccionTexto}>
                {formatFechaSubasta(pieza.subastaAsignada.fecha)}
              </Text>
              {pieza.subastaAsignada.rematador && (
                <Text style={styles.seccionTexto}>
                  Rematador: {pieza.subastaAsignada.rematador}
                </Text>
              )}
              {pieza.subastaAsignada.ubicacion && (
                <Text style={styles.seccionTexto}>{pieza.subastaAsignada.ubicacion}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
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
  },
  backTexto: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  imagenPlaceholder: {
    height: 260,
    backgroundColor: colors.border,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActivo: {
    backgroundColor: colors.textPrimary,
  },
  contenido: {
    padding: 20,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeTexto: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  titulo: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitulo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  precioContainer: {
    marginBottom: 24,
  },
  precioLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  precio: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  seccion: {
    marginBottom: 20,
  },
  seccionTitulo: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: 6,
  },
  seccionTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
