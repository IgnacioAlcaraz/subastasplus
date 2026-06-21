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
  Image,
  Dimensions,
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
  const [verFotos, setVerFotos] = useState(false);
  const [fotoActiva, setFotoActiva] = useState(0);
  const [expiryAt, setExpiryAt] = useState(salaInicial.piezaActual?.expiryAt || null);
  const [segundosRestantes, setSegundosRestantes] = useState(null);
  const [wsConectado, setWsConectado] = useState(true);

  // Countdown: ticks cada segundo usando el timestamp absoluto del servidor
  useEffect(() => {
    if (!expiryAt) { setSegundosRestantes(null); return; }
    function tick() {
      setSegundosRestantes(Math.max(0, Math.round((new Date(expiryAt).getTime() - Date.now()) / 1000)));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiryAt]);

  // ref para saber si la pieza actual tiene máximo — evita que el closure del WS quede congelado
  const sinMaximoRef = useRef(salaInicial.piezaActual?.pujaMaxima === null);
  const miUltimoPujoIdRef = useRef(null);
  const uiStateRef = useRef(uiState);
  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);

  const wsClosedManuallyRef = useRef(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT = 5;

  useEffect(() => {
    if (!token) return;
    wsClosedManuallyRef.current = false;
    reconnectAttemptsRef.current = 0;

    function connect() {
      const wsUrl =
        SERVER_URL.replace(/^http/, "ws") +
        `/v1/realtime/subastas/${subastaId}?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConectado(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === "puja_nueva") {
            setSala((prev) => {
              if (!prev.piezaActual) return prev;
              const nuevaMinima = Number(
                (msg.mejorOferta + prev.piezaActual.precioBase * 0.01).toFixed(2)
              );
              const nuevaMaxima = sinMaximoRef.current
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
            if (msg.expiryAt) setExpiryAt(msg.expiryAt);
            const esMiPuja = msg.pujo?.id && msg.pujo.id === miUltimoPujoIdRef.current;
            if (uiStateRef.current === "registrada" && !esMiPuja) {
              setMejorNueva(msg.mejorOferta);
              setUiState("superada");
            }
          }
          if (msg.event === "pieza_nueva") {
            sinMaximoRef.current = msg.pujaMaxima === null;
            const precioBase = msg.precioBase;
            const mejorOferta = msg.mejorOferta;
            const nuevaMinima = Number((mejorOferta + precioBase * 0.01).toFixed(2));
            const nuevaMaxima = sinMaximoRef.current ? null : Number((mejorOferta + precioBase * 0.2).toFixed(2));
            setSala((prev) => ({
              ...prev,
              piezaActual: {
                id: String(msg.numeroItem),
                numeroItem: msg.numeroItem,
                descripcion: msg.descripcion,
                imagenPrincipal: msg.imagenPrincipal || null,
                cantFotos: msg.cantFotos || 0,
                precioBase,
                mejorOferta,
                pujaMinima: nuevaMinima,
                pujaMaxima: nuevaMaxima,
                ultimasPujas: [],
              },
            }));
            setExpiryAt(msg.expiryAt || null);
            setMonto(String(nuevaMinima));
            if (!["ganador", "perdedor"].includes(uiStateRef.current)) {
              setUiState("sala");
            }
          }
          if (msg.event === "subasta_cerrada") {
            setVerFotos(false);
            setUiState((cur) => (cur === "ganador" ? cur : "subastaCerrada"));
          }
          if (msg.event === "pieza_cerrada") {
            setVerFotos(false);
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

      ws.onclose = () => {
        if (wsClosedManuallyRef.current) return;
        if (reconnectAttemptsRef.current < MAX_RECONNECT) {
          reconnectAttemptsRef.current += 1;
          setWsConectado(false);
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      wsClosedManuallyRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [subastaId, token]);

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
      const res = await realizarPuja(subastaId, montoNum);
      miUltimoPujoIdRef.current = res?.id ?? null;
      setMiUltimaMonto(montoNum);
      setUiState("registrada");
      setTimeout(() => {
        setUiState((cur) => (cur === "registrada" ? "sala" : cur));
      }, 3000);
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
        <TouchableOpacity onPress={handleSalir} style={styles.headerBack}>
          <Text style={styles.backTexto}>← {titulo}</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={styles.enVivoBadge}>● EN VIVO</Text>
          {segundosRestantes !== null && pieza && (
            <Text style={[
              styles.headerTimer,
              segundosRestantes <= 10 && styles.contadorUrgente,
            ]}>
              {segundosRestantes === 0 ? "Cerrando..." : `${segundosRestantes}s`}
            </Text>
          )}
        </View>
      </View>
      {!wsConectado && (
        <View style={styles.reconectandoBanner}>
          <Text style={styles.reconectandoTexto}>Reconectando...</Text>
        </View>
      )}

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

            <TouchableOpacity style={styles.streamingBoton}>
              <Text style={styles.streamingTexto}>Streaming</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={pieza.imagenPrincipal ? 0.85 : 1}
              onPress={() => {
                if (pieza.imagenPrincipal) {
                  setFotoActiva(0);
                  setVerFotos(true);
                }
              }}
            >
              {pieza.imagenPrincipal ? (
                <Image
                  source={{ uri: `${SERVER_URL}${pieza.imagenPrincipal}` }}
                  style={styles.imagenPlaceholder}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagenPlaceholder} />
              )}
            </TouchableOpacity>

            <View style={styles.pujasSeccion}>
              <Text style={styles.pujasLabel}>Últimas pujas</Text>
              <FlatList
                data={[...pieza.ultimasPujas].sort((a, b) => b.monto - a.monto)}
                keyExtractor={(item) => item.id}
                renderItem={renderPuja}
                scrollEnabled={false}
              />
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

      {/* Un solo Modal para todos los overlays de uiState: imposible que se superpongan */}
      <Modal visible={uiState !== "sala"} transparent animationType="fade">
        {uiState === "confirmar" && (
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
        )}

        {uiState === "procesando" && (
          <View style={styles.overlayOscuro}>
            <View style={styles.overlayCirculo}>
              <Text style={styles.overlayPuntos}>···</Text>
            </View>
            <Text style={styles.overlayTexto}>Procesando tu puja</Text>
          </View>
        )}

        {uiState === "registrada" && (
          <View style={styles.overlayOscuro}>
            <View style={styles.overlayCirculo}>
              <Text style={styles.overlayOK}>OK</Text>
            </View>
            <Text style={styles.overlayTitulo}>¡Puja registrada!</Text>
            <Text style={styles.overlaySubtitulo}>
              {miUltimaMonto ? formatMonto(miUltimaMonto, moneda) : ""}
            </Text>
          </View>
        )}

        {uiState === "superada" && (
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
        )}

        {uiState === "perdedor" && (
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
        )}

        {uiState === "subastaCerrada" && (
          <View style={styles.overlayOscuro}>
            <Text style={styles.overlayTitulo}>La subasta finalizó</Text>
            <Text style={styles.overlayTexto}>Gracias por participar</Text>
            <TouchableOpacity
              style={[styles.ganadorBoton, { marginTop: 24 }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.ganadorBotonTexto}>Volver</Text>
            </TouchableOpacity>
          </View>
        )}

        {uiState === "ganador" && (
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
              onPress={() => {
                navigation.replace("FacturaCompra", {
                  compraId,
                  moneda,
                  numeroItem: piezaGanada?.numeroItem,
                });
              }}
            >
              <Text style={styles.ganadorBotonTexto}>Proceder al pago</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* ── Visor de fotos ── */}
      <Modal visible={verFotos} transparent animationType="fade" onRequestClose={() => setVerFotos(false)}>
        <View style={styles.fotosOverlay}>
          <TouchableOpacity style={styles.fotosCerrar} onPress={() => setVerFotos(false)}>
            <Text style={styles.fotosCerrarTexto}>✕</Text>
          </TouchableOpacity>
          {pieza && pieza.cantFotos > 0 && (
            <>
              <FlatList
                data={Array.from({ length: pieza.cantFotos }, (_, i) => i)}
                keyExtractor={(i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={fotoActiva}
                getItemLayout={(_, index) => ({
                  length: Dimensions.get("window").width,
                  offset: Dimensions.get("window").width * index,
                  index,
                })}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / Dimensions.get("window").width
                  );
                  setFotoActiva(index);
                }}
                renderItem={({ item: idx }) => (
                  <Image
                    source={{ uri: `${SERVER_URL}/v1/piezas/${pieza.numeroItem}/fotos/${idx}` }}
                    style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height * 0.75 }}
                    resizeMode="contain"
                  />
                )}
              />
              {pieza.cantFotos > 1 && (
                <View style={styles.fotosDots}>
                  {Array.from({ length: pieza.cantFotos }, (_, i) => (
                    <View key={i} style={[styles.fotosDot, i === fotoActiva && styles.fotosDotActivo]} />
                  ))}
                </View>
              )}
              <Text style={styles.fotosContador}>{fotoActiva + 1} / {pieza.cantFotos}</Text>
            </>
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SALA.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: SALA.borde,
  },
  headerBack: { flex: 1, marginRight: 12 },
  headerRight: { alignItems: "flex-end", gap: 2 },
  backTexto: { ...typography.body, color: SALA.texto, fontWeight: "600" },
  enVivoBadge: { ...typography.caption, color: SALA.verde, fontWeight: "700" },
  headerTimer: {
    ...typography.caption,
    color: SALA.textoSec,
    fontVariant: ["tabular-nums"],
  },
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
  contadorRow: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: SALA.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: SALA.borde,
  },
  contadorTexto: {
    ...typography.caption,
    color: SALA.textoSec,
    fontVariant: ["tabular-nums"],
  },
  contadorUrgente: { color: "#FF4D4D", fontWeight: "700" },
  reconectandoBanner: {
    backgroundColor: "#7A3A00",
    paddingVertical: 6,
    alignItems: "center",
  },
  reconectandoTexto: { ...typography.caption, color: "#FFD580" },
  fotosOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fotosCerrar: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fotosCerrarTexto: { fontSize: 22, color: "#fff", fontWeight: "700" },
  fotosDots: {
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
  },
  fotosDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  fotosDotActivo: { backgroundColor: "#fff" },
  fotosContador: {
    marginTop: 10,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
});
