import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { useAuth } from "../../context/AuthContext";
import { SERVER_URL } from "../../api/client";
import { realizarPuja, salirSala } from "../../api/subastas";

// la sala de subastas tiene su propia paleta oscura, separada del tema general de la app
const SALA = {
  bg: "#111111",
  surface: "#1C1C1E",
  surfaceAlt: "#2C2C2E",
  texto: "#FFFFFF",
  textoSec: "#ABABAB",
  borde: "#3A3A3C",
  verde: "#30D158",
  rojo: "#FF453A",
};

function formatMonto(monto, moneda) {
  return `${moneda} ${Number(monto).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// los incrementos rápidos se calculan como porcentaje del precio base, no de la oferta actual
function calcularOpciones(mejorOferta, precioBase) {
  return [
    { label: "+1%", monto: Number((mejorOferta + precioBase * 0.01).toFixed(2)) },
    { label: "+5%", monto: Number((mejorOferta + precioBase * 0.05).toFixed(2)) },
    { label: "+10%", monto: Number((mejorOferta + precioBase * 0.1).toFixed(2)) },
  ];
}

export default function SalaScreen({ navigation, route }) {
  const { sala: salaInicial, subastaId, titulo, moneda } = route.params;
  const { token, user } = useAuth();

  const [sala, setSala] = useState(salaInicial);
  const [monto, setMonto] = useState(
    String(salaInicial.piezaActual?.pujaMinima ?? "")
  );
  const [uiState, setUiState] = useState("sala");
  const [miUltimaMonto, setMiUltimaMonto] = useState(null);
  const [mejorNueva, setMejorNueva] = useState(null);
  const [piezaGanada, setPiezaGanada] = useState(null);
  const [compraId, setCompraId] = useState(null);
  const [montoGanadorAjeno, setMontoGanadorAjeno] = useState(null);

  const sinMaximo = salaInicial.piezaActual?.pujaMaxima === null;
  // necesitamos el ref porque el handler del WebSocket captura el closure inicial y no ve updates del estado
  const uiStateRef = useRef(uiState);
  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);

  useEffect(() => {
    if (!token) return;
    // convertimos el URL de http a ws para la conexión en tiempo real
    const wsUrl =
      SERVER_URL.replace(/^http/, "ws") +
      `/v1/realtime/subastas/${subastaId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "puja_nueva") {
          // actualizamos la sala con la nueva oferta y recalculamos los límites de puja
          setSala((prev) => {
            if (!prev.piezaActual) return prev;
            const nuevaMinima = Number(
              (msg.mejorOferta + prev.piezaActual.precioBase * 0.01).toFixed(2)
            );
            const nuevaMaxima = sinMaximo
              ? null
              : Number(
                  (msg.mejorOferta + prev.piezaActual.precioBase * 0.2).toFixed(2)
                );
            return {
              ...prev,
              piezaActual: {
                ...prev.piezaActual,
                mejorOferta: msg.mejorOferta,
                pujaMinima: nuevaMinima,
                pujaMaxima: nuevaMaxima,
                ultimasPujas: [msg.pujo, ...prev.piezaActual.ultimasPujas].slice(0, 10),
              },
            };
          });
          if (uiStateRef.current === "registrada") {
            setMejorNueva(msg.mejorOferta);
            setUiState("superada");
          }
        }
        if (msg.event === "pieza_nueva") {
          const precioBase = msg.precioBase;
          const mejorOferta = msg.mejorOferta;
          const nuevaMinima = Number((mejorOferta + precioBase * 0.01).toFixed(2));
          const nuevaMaxima = sinMaximo ? null : Number((mejorOferta + precioBase * 0.2).toFixed(2));
          setSala((prev) => ({
            ...prev,
            piezaActual: {
              id: String(msg.numeroItem),
              numeroItem: msg.numeroItem,
              descripcion: msg.descripcion,
              precioBase,
              mejorOferta,
              pujaMinima: nuevaMinima,
              pujaMaxima: nuevaMaxima,
              ultimasPujas: [],
            },
          }));
          setMonto(String(nuevaMinima));
          if (!["ganador", "perdedor"].includes(uiStateRef.current)) {
            setUiState("sala");
          }
        }
        if (msg.event === "pieza_cerrada") {
          // comparamos con el id del usuario para saber si ganamos o perdimos la pieza
          if (msg.ganadorClienteId && String(msg.ganadorClienteId) === user?.id) {
            setPiezaGanada({ numeroItem: msg.numeroItem, montoGanador: msg.montoGanador });
            setCompraId(msg.compraId);
            setUiState("ganador");
          } else {
            setMontoGanadorAjeno(msg.montoGanador);
            setUiState("perdedor");
          }
        }
      } catch (_) {}
    };

    ws.onerror = () => {};

    return () => {
      ws.close();
    };
  }, [subastaId, token, sinMaximo]);

  const handleSalir = useCallback(async () => {
    try {
      await salirSala(subastaId);
    } catch (_) {}
    navigation.goBack();
  }, [subastaId, navigation]);

  useEffect(() => {
    // en Android necesitamos interceptar el botón físico de atrás para llamar a salirSala correctamente
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleSalir();
      return true;
    });
    return () => sub.remove();
  }, [handleSalir]);

  async function handleConfirmar() {
    const montoNum = parseFloat(String(monto).replace(",", "."));
    setUiState("procesando");
    try {
      await realizarPuja(subastaId, montoNum);
      setMiUltimaMonto(montoNum);
      setUiState("registrada");
    } catch (error) {
      setUiState("sala");
      Alert.alert(
        "No se pudo registrar la puja",
        error.message || "Intentá de nuevo."
      );
    }
  }

  const pieza = sala.piezaActual;
  const opciones = pieza ? calcularOpciones(pieza.mejorOferta, pieza.precioBase) : [];

  function renderPuja({ item }) {
    return (
      <View style={styles.pujaFila}>
        <Text style={[styles.pujaPostor, item.esPropia && { color: SALA.verde }]}>
          {item.postorId}
        </Text>
        <Text style={styles.pujaMonto}>{formatMonto(item.monto, moneda)}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSalir}>
          <Text style={styles.backTexto}>← {titulo}</Text>
        </TouchableOpacity>
      </View>

      {!pieza ? (
        <View style={styles.esperando}>
          <Text style={styles.esperandoTexto}>Esperando inicio de subasta...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <View style={styles.piezaHeader}>
              <Text style={styles.piezaNumero}>
                Pieza actual #{String(pieza.numeroItem).padStart(3, "0")}
              </Text>
              <Text style={styles.piezaDesc}>{pieza.descripcion}</Text>
              <View style={styles.preciosRow}>
                <Text style={styles.precioLabel}>
                  Base:{" "}
                  <Text style={styles.precioValor}>
                    {formatMonto(pieza.precioBase, moneda)}
                  </Text>
                </Text>
                <Text style={styles.precioLabel}>
                  Mejor:{" "}
                  <Text style={[styles.precioValor, { color: SALA.verde }]}>
                    {formatMonto(pieza.mejorOferta, moneda)}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.pujasSeccion}>
              <Text style={styles.pujasLabel}>Últimas pujas</Text>
              <FlatList
                data={pieza.ultimasPujas}
                keyExtractor={(item) => item.id}
                renderItem={renderPuja}
                scrollEnabled={false}
              />
            </View>

            <TouchableOpacity style={styles.streamingBoton}>
              <Text style={styles.streamingTexto}>Streaming</Text>
            </TouchableOpacity>

            <View style={styles.imagenPlaceholder}>
              <Text style={styles.imagenTexto}>imagen</Text>
            </View>
          </ScrollView>

          <View style={styles.bottomFija}>
            <View style={styles.limitesRow}>
              <Text style={styles.limiteTexto}>
                Min: {formatMonto(pieza.pujaMinima, moneda)}
              </Text>
              {pieza.pujaMaxima !== null && (
                <Text style={styles.limiteTexto}>
                  Max: {formatMonto(pieza.pujaMaxima, moneda)}
                </Text>
              )}
            </View>

            <View style={styles.opcionesRow}>
              {opciones.map((op) => (
                <TouchableOpacity
                  key={op.label}
                  style={styles.opcionBoton}
                  onPress={() => setMonto(String(op.monto))}
                >
                  <Text style={styles.opcionLabel}>{op.label}</Text>
                  <Text style={styles.opcionMonto}>
                    {formatMonto(op.monto, moneda)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.pujarRow}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputMoneda}>{moneda}</Text>
                <TextInput
                  style={styles.input}
                  value={monto}
                  onChangeText={setMonto}
                  keyboardType="numeric"
                  placeholderTextColor={SALA.textoSec}
                />
              </View>
              <TouchableOpacity
                style={styles.pujarBoton}
                onPress={() => setUiState("confirmar")}
              >
                <Text style={styles.pujarTexto}>PUJAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <Modal visible={uiState === "confirmar"} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Confirmar puja</Text>
            <View style={styles.modalInfo}>
              <Text style={styles.modalPieza}>
                Pieza #{pieza ? String(pieza.numeroItem).padStart(3, "0") : "-"}
              </Text>
              <Text style={styles.modalMonto}>
                {formatMonto(monto || 0, moneda)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalBotonPrimario}
              onPress={handleConfirmar}
            >
              <Text style={styles.modalBotonTexto}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBotonSecundario}
              onPress={() => setUiState("sala")}
            >
              <Text style={styles.modalBotonSecTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={uiState === "procesando"} transparent animationType="fade">
        <View style={styles.overlayOscuro}>
          <View style={styles.overlayCirculo}>
            <Text style={styles.overlayPuntos}>···</Text>
          </View>
          <Text style={styles.overlayTexto}>Procesando tu puja</Text>
        </View>
      </Modal>

      <Modal visible={uiState === "registrada"} transparent animationType="fade">
        <View style={styles.overlayOscuro}>
          <View style={styles.overlayCirculo}>
            <Text style={styles.overlayOK}>OK</Text>
          </View>
          <Text style={styles.overlayTitulo}>¡Puja registrada!</Text>
          <Text style={styles.overlaySubtitulo}>
            {miUltimaMonto ? formatMonto(miUltimaMonto, moneda) : ""}
          </Text>
        </View>
      </Modal>

      <Modal visible={uiState === "superada"} transparent animationType="fade">
        <View style={styles.overlayOscuro}>
          <View style={styles.superadaCard}>
            <Text style={styles.superadaTitulo}>Tu puja fue superada</Text>
            {mejorNueva && (
              <Text style={styles.superadaNueva}>
                Nueva mejor: {formatMonto(mejorNueva, moneda)}
              </Text>
            )}
            {miUltimaMonto && (
              <Text style={styles.superadaMia}>
                Tu oferta: {formatMonto(miUltimaMonto, moneda)}
              </Text>
            )}
            <TouchableOpacity
              style={styles.superadaBoton}
              onPress={() => {
                const nuevaMinima = pieza
                  ? Number((mejorNueva + pieza.precioBase * 0.01).toFixed(2))
                  : monto;
                setMonto(String(nuevaMinima));
                setMejorNueva(null);
                setMiUltimaMonto(null);
                setUiState("sala");
              }}
            >
              <Text style={styles.superadaBotonTexto}>Hacer nueva puja</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Overlay: Perdedor ── */}
      <Modal visible={uiState === "perdedor"} transparent animationType="fade">
        <View style={styles.perdedorOverlay}>
          <Text style={styles.perdedorX}>✕</Text>
          <Text style={styles.perdedorTitulo}>Pieza adjudicada a otro</Text>
          {montoGanadorAjeno && (
            <Text style={styles.perdedorSubtitulo}>
              Ganador: {formatMonto(montoGanadorAjeno, moneda)}
            </Text>
          )}
          <TouchableOpacity style={styles.perdedorBoton} onPress={handleSalir}>
            <Text style={styles.perdedorBotonTexto}>Salir</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Overlay: Ganador ── */}
      <Modal visible={uiState === "ganador"} transparent animationType="fade">
        <View style={styles.overlayOscuro}>
          <View style={styles.overlayCirculo}>
            <Text style={styles.overlayExclamacion}>!!</Text>
          </View>
          <Text style={styles.overlayTitulo}>¡Felicitaciones!</Text>
          <Text style={styles.overlayTexto}>
            Ganaste la pieza #{piezaGanada ? String(piezaGanada.numeroItem).padStart(3, "0") : ""}
          </Text>
          <Text style={[styles.overlayTitulo, { fontWeight: "700" }]}>
            {piezaGanada ? formatMonto(piezaGanada.montoGanador, moneda) : ""}
          </Text>
          <TouchableOpacity
            style={styles.ganadorBoton}
            onPress={() =>
              navigation.navigate("SelMedioPago", {
                compraId,
                moneda,
                numeroItem: piezaGanada?.numeroItem,
              })
            }
          >
            <Text style={styles.ganadorBotonTexto}>Proceder al pago</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SALA.bg },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: SALA.borde,
  },
  backTexto: { ...typography.body, color: SALA.texto, fontWeight: "600" },
  esperando: { flex: 1, justifyContent: "center", alignItems: "center" },
  esperandoTexto: { ...typography.body, color: SALA.textoSec },
  piezaHeader: { padding: 20, paddingBottom: 12 },
  piezaNumero: { ...typography.caption, color: SALA.textoSec, marginBottom: 4 },
  piezaDesc: { ...typography.h2, color: SALA.texto, marginBottom: 10 },
  preciosRow: { flexDirection: "row", gap: 24 },
  precioLabel: { ...typography.bodySmall, color: SALA.textoSec },
  precioValor: { color: SALA.texto, fontWeight: "600" },
  pujasSeccion: { paddingHorizontal: 20, marginBottom: 12 },
  pujasLabel: { ...typography.caption, color: SALA.textoSec, marginBottom: 6 },
  pujaFila: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: SALA.borde,
  },
  pujaPostor: { ...typography.bodySmall, color: SALA.texto, flex: 1 },
  pujaMonto: {
    ...typography.bodySmall,
    color: SALA.texto,
    fontWeight: "600",
    marginRight: 12,
  },
  streamingBoton: {
    alignSelf: "center",
    backgroundColor: SALA.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 12,
  },
  streamingTexto: { ...typography.bodySmall, color: SALA.texto },
  scrollArea: { flex: 1 },
  bottomFija: {
    borderTopWidth: 1,
    borderTopColor: SALA.borde,
    paddingTop: 10,
  },
  imagenPlaceholder: {
    marginHorizontal: 20,
    height: 140,
    backgroundColor: SALA.surface,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  imagenTexto: { ...typography.body, color: SALA.textoSec },
  limitesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  limiteTexto: { ...typography.caption, color: SALA.textoSec },
  opcionesRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  opcionBoton: {
    flex: 1,
    backgroundColor: SALA.surfaceAlt,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  opcionLabel: { ...typography.caption, color: SALA.textoSec },
  opcionMonto: { ...typography.caption, color: SALA.texto, fontWeight: "600" },
  pujarRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 16,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SALA.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: SALA.borde,
  },
  inputMoneda: { ...typography.body, color: SALA.textoSec, marginRight: 6 },
  input: { flex: 1, ...typography.body, color: SALA.texto, paddingVertical: 12 },
  pujarBoton: {
    backgroundColor: SALA.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  pujarTexto: { ...typography.button, color: SALA.texto, letterSpacing: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  modalTitulo: { ...typography.h3, color: colors.textPrimary, marginBottom: 16 },
  modalInfo: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  modalPieza: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  modalMonto: { ...typography.h2, color: colors.textPrimary },
  modalBotonPrimario: {
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  modalBotonTexto: { ...typography.button, color: colors.surface },
  modalBotonSecundario: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBotonSecTexto: { ...typography.button, color: colors.textSecondary },
  overlayOscuro: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  overlayCirculo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SALA.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayPuntos: { fontSize: 28, color: SALA.texto, letterSpacing: 4 },
  overlayOK: { fontSize: 22, color: SALA.texto, fontWeight: "700" },
  overlayTitulo: { ...typography.h2, color: SALA.texto },
  overlayTexto: { ...typography.body, color: SALA.textoSec },
  overlaySubtitulo: { ...typography.h3, color: SALA.textoSec },
  superadaCard: {
    backgroundColor: SALA.surface,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    width: "85%",
    gap: 10,
  },
  superadaTitulo: { ...typography.h3, color: SALA.texto },
  superadaNueva: { ...typography.body, color: SALA.texto, fontWeight: "600" },
  superadaMia: { ...typography.bodySmall, color: SALA.textoSec },
  superadaBoton: {
    backgroundColor: SALA.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  superadaBotonTexto: { ...typography.button, color: SALA.texto },
  perdedorOverlay: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  perdedorX: { fontSize: 36, color: colors.textSecondary, marginBottom: 8 },
  perdedorTitulo: { ...typography.h3, color: colors.textPrimary, textAlign: "center" },
  perdedorSubtitulo: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  perdedorBoton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: "center",
    marginTop: 16,
  },
  perdedorBotonTexto: { ...typography.button, color: colors.textSecondary },
  overlayExclamacion: { fontSize: 26, color: SALA.texto, fontWeight: "700" },
  ganadorBoton: {
    backgroundColor: SALA.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 8,
  },
  ganadorBotonTexto: { ...typography.button, color: SALA.texto },
});
