import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { SERVER_URL, esErrorServidor } from "../../api/client";
import ServerErrorScreen from "../../components/common/ServerErrorScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatFechaSubasta(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  const dia = date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" });
  const hora = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs";
  return `${dia}, ${hora}`;
}

function prefixMoneda(moneda) {
  if (moneda === "USD") return "US$";
  if (moneda === "ARS") return "$";
  return moneda || "$";
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function Carrusel({ imagenes, imagenActiva, onCambio }) {
  const ref = useRef(null);

  function ir(index) {
    if (index < 0 || index >= imagenes.length) return;
    ref.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: true });
    onCambio(index);
  }

  if (imagenes.length === 0) {
    return <View style={styles.carruselPlaceholder} />;
  }

  return (
    <View>
      <FlatList
        ref={ref}
        data={imagenes}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          onCambio(index);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: `${SERVER_URL}${item}` }}
            style={styles.carruselImagen}
            resizeMode="contain"
          />
        )}
      />

      {imagenes.length > 1 && (
        <>
          <TouchableOpacity style={styles.arrowLeft} onPress={() => ir(imagenActiva - 1)} activeOpacity={0.7}>
            <Text style={styles.arrowTexto}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.arrowRight} onPress={() => ir(imagenActiva + 1)} activeOpacity={0.7}>
            <Text style={styles.arrowTexto}>›</Text>
          </TouchableOpacity>
          <View style={styles.counterBadge}>
            <Text style={styles.counterTexto}>{imagenActiva + 1}/{imagenes.length}</Text>
          </View>
        </>
      )}

      <View style={styles.dots}>
        {imagenes.map((_, i) => (
          <View key={i} style={[styles.dot, i === imagenActiva && styles.dotActivo]} />
        ))}
      </View>
    </View>
  );
}

export default function PieceDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const [pieza, setPieza] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorServidor, setErrorServidor] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);

  const cargarPieza = useCallback(async () => {
    setLoading(true);
    setErrorServidor(false);
    try {
      const datos = await getPiezaById(id);
      setPieza(datos);
    } catch (error) {
      if (esErrorServidor(error)) {
        setErrorServidor(true);
      } else {
        Alert.alert("Error", "No se pudo cargar la pieza");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarPieza();
  }, [cargarPieza]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorServidor) {
    return <ServerErrorScreen onRetry={cargarPieza} />;
  }

  if (!pieza) return null;

  const monedaPrefix = prefixMoneda(pieza.moneda);
  const titulo = pieza.tituloObra || pieza.descripcion;
  const descripcionBody = pieza.descripcion !== titulo ? pieza.descripcion : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Carrusel
          imagenes={pieza.imagenes}
          imagenActiva={imagenActiva}
          onCambio={setImagenActiva}
        />

        <View style={styles.contenido}>
          {/* Badges */}
          {(pieza.esObraDeArte || pieza.subastaAsignada?.categoria) && (
            <View style={styles.badgesRow}>
              {pieza.esObraDeArte && (
                <View style={styles.badgeObra}>
                  <Text style={styles.badgeObraTexto}>Obra de arte</Text>
                </View>
              )}
              {pieza.subastaAsignada?.categoria && (
                <View style={styles.badgeSubasta}>
                  <Text style={styles.badgeSubastaTexto}>
                    Subasta {capitalize(pieza.subastaAsignada.categoria)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Título */}
          <Text style={styles.titulo}>{titulo}</Text>

          {/* Subtitle: pieza # - artista */}
          <Text style={styles.subtitulo}>
            Pieza #{String(pieza.numeroItem).padStart(3, "0")}
            {pieza.artista?.nombre ? ` · ${pieza.artista.nombre}` : ""}
          </Text>

          {/* Card precio base + comisión */}
          {pieza.precioBase !== null && (
            <View style={styles.precioCard}>
              <View>
                <Text style={styles.precioCardLabel}>Precio base</Text>
                <Text style={styles.precioCardValor}>
                  {monedaPrefix} {pieza.precioBase.toLocaleString("es-AR")}
                </Text>
              </View>
              {pieza.comision != null && pieza.comision > 0 && (
                <View style={styles.comisionCol}>
                  <Text style={styles.comisionLabel}>Comisión</Text>
                  <Text style={styles.comisionValor}>{pieza.comision}%</Text>
                </View>
              )}
            </View>
          )}

          {/* Descripción */}
          {descripcionBody ? (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Descripción</Text>
              <Text style={styles.seccionTexto}>{descripcionBody}</Text>
            </View>
          ) : null}

          {/* Historia y procedencia */}
          {pieza.artista?.historia ? (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Historia y procedencia</Text>
              <Text style={styles.seccionTexto}>{pieza.artista.historia}</Text>
            </View>
          ) : null}

          {/* Subasta asignada */}
          {pieza.subastaAsignada && (
            <View style={styles.subastaCard}>
              <Text style={styles.subastaCardTitulo}>Subasta asignada</Text>
              <View style={styles.subastaCardFila}>
                <Text style={styles.subastaCardLabel}>Fecha</Text>
                <Text style={styles.subastaCardValor}>
                  {formatFechaSubasta(pieza.subastaAsignada.fecha)}
                </Text>
              </View>
              {pieza.subastaAsignada.rematador && (
                <View style={styles.subastaCardFila}>
                  <Text style={styles.subastaCardLabel}>Rematador</Text>
                  <Text style={styles.subastaCardValor}>{pieza.subastaAsignada.rematador}</Text>
                </View>
              )}
              {pieza.subastaAsignada.ubicacion && (
                <View style={styles.subastaCardFila}>
                  <Text style={styles.subastaCardLabel}>Ubicación</Text>
                  <Text style={styles.subastaCardValor}>{pieza.subastaAsignada.ubicacion}</Text>
                </View>
              )}
            </View>
          )}

          {/* Banner cantidad elementos */}
          {pieza.cantidadElementos > 1 && (
            <View style={styles.elementosBanner}>
              <Text style={styles.elementosBannerTexto}>
                Esta pieza está compuesta por {pieza.cantidadElementos} elementos
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backTexto: {
    ...typography.h2,
    color: colors.textPrimary,
  },

  // Carrusel
  carruselPlaceholder: {
    width: SCREEN_WIDTH,
    height: 260,
    backgroundColor: colors.border,
  },
  carruselImagen: {
    width: SCREEN_WIDTH,
    height: 260,
    backgroundColor: colors.background,
  },
  arrowLeft: {
    position: "absolute",
    left: 12,
    top: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowRight: {
    position: "absolute",
    right: 12,
    top: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowTexto: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "300",
    lineHeight: 30,
    marginTop: -2,
  },
  counterBadge: {
    position: "absolute",
    bottom: 20,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  counterTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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

  // Contenido
  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  badgeObra: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeObraTexto: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  badgeSubasta: {
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: "#F5C518",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeSubastaTexto: {
    ...typography.caption,
    color: "#9A7200",
    fontWeight: "600",
  },
  titulo: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 6,
    fontWeight: "700",
  },
  subtitulo: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 20,
  },

  // Precio card
  precioCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: colors.background,
  },
  precioCardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  precioCardValor: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  comisionCol: {
    alignItems: "flex-end",
  },
  comisionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  comisionValor: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  // Secciones de texto
  seccion: {
    marginBottom: 24,
  },
  seccionTitulo: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 15,
  },
  seccionTexto: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Subasta asignada
  subastaCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  subastaCardTitulo: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: 4,
  },
  subastaCardFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  subastaCardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  subastaCardValor: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },

  // Banner cantidad elementos
  elementosBanner: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  elementosBannerTexto: {
    ...typography.bodySmall,
    color: "#92400E",
    textAlign: "center",
  },
});
