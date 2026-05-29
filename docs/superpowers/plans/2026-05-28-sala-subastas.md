# Sala de Subastas - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el flujo completo de sala de subastas — pantalla de verificación pre-ingreso y sala en vivo con pujas en tiempo real vía WebSocket.

**Architecture:** 3 nuevas funciones en la API, 2 nuevas pantallas (PreIngresoScreen + SalaScreen), 2 archivos modificados (navigator + detail screen). SalaScreen usa la WebSocket nativa de React Native para recibir eventos de puja en tiempo real y una máquina de estados local para manejar los overlays de confirmación, procesamiento y resultado.

**Tech Stack:** React Native, Expo, native WebSocket API, React Navigation stack, colors.js, typography.js.

---

## File Map

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Modificar | `frontend/subastasplus/src/api/subastas.js` | Agregar getSala, realizarPuja, salirSala |
| Modificar | `frontend/subastasplus/src/navigation/AuctionsNavigator.js` | Agregar rutas PreIngreso y Sala |
| Modificar | `frontend/subastasplus/src/screens/auctions/AuctionDetailScreen.js` | Conectar botón "Entrar a subasta" para usuarios autenticados |
| Crear | `frontend/subastasplus/src/screens/auctions/PreIngresoScreen.js` | Pantalla de verificación de acceso (categoría + medio de pago) |
| Crear | `frontend/subastasplus/src/screens/auctions/SalaScreen.js` | Sala en vivo: layout oscuro, pujas, WebSocket, overlays de estado |

---

## Contexto de datos del backend

### GET /subastas/:id/sala (requiere token)

Devuelve si el usuario puede entrar. Si no puede, tira 403 con código de error.

```json
{
  "subastaId": "42",
  "piezaActual": {
    "id": "47",
    "numeroItem": 47,
    "descripcion": "Naturaleza Muerta",
    "imagenPrincipal": null,
    "precioBase": 45000,
    "mejorOferta": 52300,
    "pujaMinima": 52750,
    "pujaMaxima": 61300,
    "ultimasPujas": [
      { "id": "1", "postorId": "Postor #142", "monto": 52300, "timestamp": "ISO", "esPropia": false }
    ]
  },
  "streamingUrl": "https://streaming.subastasplus.local/...",
  "conectados": 5
}
```

`piezaActual` puede ser `null` si la subasta aún no inició o está entre piezas.
`pujaMaxima` es `null` para categorías `oro` y `platino`.

### POST /subastas/:id/pujas (requiere token)

Body: `{ "monto": 53200 }`

Respuesta exitosa (201):
```json
{ "id": "123", "monto": 53200, "estado": "ganadora", "timestamp": "ISO" }
```

Errores posibles: 400 PUJA_MONTO_INSUFICIENTE, 400 PUJA_MONTO_EXCEDIDO, 409 SUBASTA_SIN_PIEZA_ACTIVA.

### POST /subastas/:id/sala/salir (requiere token)

Sin body. Respuesta 204.

### WebSocket ws://<host>:3000/v1/realtime/subastas/:id?token=<jwt>

Evento recibido cuando alguien puja:
```json
{
  "event": "puja_nueva",
  "pujo": { "id": "124", "postorId": "Postor #089", "monto": 54100, "timestamp": "ISO" },
  "mejorOferta": 54100
}
```

### GET /subastas/:id (detalle) — ya existente

Incluye campos relevantes para PreIngresoScreen:
```json
{
  "puedeEntrar": true,
  "razonNoEntrar": null,
  "categoria": "especial",
  "titulo": "Arte Moderno #47"
}
```

`razonNoEntrar` puede ser: `"Categoría insuficiente"`, `"Sin medio de pago verificado"`, o `null`.

---

## Lógica de verificación (PreIngresoScreen)

```js
const categoriaOK = subasta.puedeEntrar || subasta.razonNoEntrar !== "Categoría insuficiente";
const medioPagoOK = subasta.puedeEntrar || subasta.razonNoEntrar === "Categoría insuficiente";
const puedeEntrar = categoriaOK && medioPagoOK;
```

---

## Máquina de estados (SalaScreen)

```
'sala'       → usuario puede editar monto y pulsar PUJAR
'confirmar'  → modal de confirmación visible (tap PUJAR)
'procesando' → overlay oscuro + "..." mientras POST /pujas vuela
'registrada' → overlay oscuro + OK + monto registrado (POST exitoso)
'superada'   → overlay oscuro + "Tu puja fue superada" + nueva mejor oferta
```

Transiciones:
- `sala` → `confirmar`: tap PUJAR
- `confirmar` → `sala`: tap Cancelar
- `confirmar` → `procesando`: tap Confirmar
- `procesando` → `registrada`: POST /pujas exitoso
- `procesando` → `sala`: POST /pujas falla (Alert + vuelve)
- `registrada` → `superada`: WS recibe `puja_nueva` (otro postor)
- `superada` → `sala`: tap "Hacer nueva puja" (resetea monto a nueva pujaMinima)

---

## Recálculo de límites tras evento WS

Cuando llega `puja_nueva`, los límites deben actualizarse en el estado local:

```js
const nuevaMinima = Number((msg.mejorOferta + piezaActual.precioBase * 0.01).toFixed(2));
const nuevaMaxima = sinMaximo ? null : Number((msg.mejorOferta + piezaActual.precioBase * 0.2).toFixed(2));
```

`sinMaximo = sala.piezaActual?.pujaMaxima === null` — se fija al entrar a la sala y no cambia.

---

## URL del WebSocket

```js
import { SERVER_URL } from '../api/client';
const wsUrl = SERVER_URL.replace(/^http/, 'ws') + `/v1/realtime/subastas/${subastaId}?token=${token}`;
```

`SERVER_URL` = `http://<host>:3000`.  
`token` viene de `useAuth().token`.

---

## Task 1: Agregar funciones de API

**Archivo:** `frontend/subastasplus/src/api/subastas.js`

- [ ] **Agregar las 3 funciones nuevas al final del archivo:**

```js
export async function getSala(subastaId) {
  const response = await client.get(`/subastas/${subastaId}/sala`);
  return response.data;
}

export async function realizarPuja(subastaId, monto) {
  const response = await client.post(`/subastas/${subastaId}/pujas`, { monto });
  return response.data;
}

export async function salirSala(subastaId) {
  await client.post(`/subastas/${subastaId}/sala/salir`);
}
```

- [ ] **Commit:**
```
git add frontend/subastasplus/src/api/subastas.js
git commit -m "feat: add getSala, realizarPuja, salirSala to subastas API"
```

---

## Task 2: Agregar rutas al navigator

**Archivo:** `frontend/subastasplus/src/navigation/AuctionsNavigator.js`

- [ ] **Agregar los imports y las dos rutas nuevas:**

```js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AuctionsScreen from "../screens/auctions/AuctionsScreen";
import AuctionDetailScreen from "../screens/auctions/AuctionDetailScreen";
import CatalogScreen from "../screens/auctions/CatalogScreen";
import PieceDetailScreen from "../screens/auctions/PieceDetailScreen";
import PreIngresoScreen from "../screens/auctions/PreIngresoScreen";
import SalaScreen from "../screens/auctions/SalaScreen";

const Stack = createStackNavigator();

export default function AuctionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuctionsList" component={AuctionsScreen} />
      <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} />
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="PieceDetail" component={PieceDetailScreen} />
      <Stack.Screen name="PreIngreso" component={PreIngresoScreen} />
      <Stack.Screen name="Sala" component={SalaScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Commit:**
```
git add frontend/subastasplus/src/navigation/AuctionsNavigator.js
git commit -m "feat: add PreIngreso and Sala routes to AuctionsNavigator"
```

---

## Task 3: Conectar botón "Entrar a subasta" en AuctionDetailScreen

**Archivo:** `frontend/subastasplus/src/screens/auctions/AuctionDetailScreen.js`

El botón actual solo maneja el caso `isGuest`. Hay que agregar la navegación a PreIngreso para usuarios autenticados.

- [ ] **Reemplazar el `onPress` del botón "Entrar a subasta":**

Antes:
```js
onPress={() => {
  if (isGuest) setModalVisible(true);
}}
```

Después:
```js
onPress={() => {
  if (isGuest) {
    setModalVisible(true);
  } else {
    navigation.navigate("PreIngreso", { subasta });
  }
}}
```

- [ ] **Verificar en app:** tocar "Entrar a subasta" en una subasta desde un usuario autenticado debe navegar a una pantalla en blanco (PreIngreso aún no existe, React Navigation mostrará error hasta el Task 4).

- [ ] **Commit:**
```
git add frontend/subastasplus/src/screens/auctions/AuctionDetailScreen.js
git commit -m "feat: wire Entrar a subasta button to PreIngreso for authenticated users"
```

---

## Task 4: Crear PreIngresoScreen

**Archivo:** `frontend/subastasplus/src/screens/auctions/PreIngresoScreen.js`

- [ ] **Crear el archivo completo:**

```js
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
      Alert.alert("No podés ingresar", error.message || "Error al acceder a la sala.");
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
```

- [ ] **Verificar en app:**
  - Desde AuctionDetail → "Entrar a subasta" → debe mostrar PreIngresoScreen con los datos de la subasta
  - Si `puedeEntrar` es false → botón debe estar gris y deshabilitado
  - Si `puedeEntrar` es true → tap en el botón debe llamar GET /sala (ver en logs/network)
  - Si GET /sala falla → Alert con el mensaje de error

- [ ] **Commit:**
```
git add frontend/subastasplus/src/screens/auctions/PreIngresoScreen.js
git commit -m "feat: add PreIngresoScreen with access verification"
```

---

## Task 5: SalaScreen — layout base (tema oscuro, info de pieza, lista de pujas)

**Archivo:** `frontend/subastasplus/src/screens/auctions/SalaScreen.js`

En este task se construye la estructura visual sin interacción. El objetivo es ver la sala renderizada correctamente con datos mockeados del endpoint.

- [ ] **Crear el archivo con el layout completo:**

```js
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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

// Colores del tema oscuro de la sala
const SALA = {
  bg: "#111111",
  surface: "#1C1C1E",
  surfaceAlt: "#2C2C2E",
  texto: "#FFFFFF",
  textoSec: "#ABABAB",
  borde: "#3A3A3C",
  verde: "#30D158",
  rojo: "#FF453A",
  boton: "#2C2C2E",
};

function formatMonto(monto, moneda) {
  return `${moneda} ${Number(monto).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function calcularOpciones(mejorOferta, precioBase) {
  return [
    { label: "+1%", monto: Number((mejorOferta + precioBase * 0.01).toFixed(2)) },
    { label: "+5%", monto: Number((mejorOferta + precioBase * 0.05).toFixed(2)) },
    { label: "+10%", monto: Number((mejorOferta + precioBase * 0.1).toFixed(2)) },
  ];
}

export default function SalaScreen({ navigation, route }) {
  const { sala: salaInicial, subastaId, titulo, moneda } = route.params;
  const { token } = useAuth();

  const [sala, setSala] = useState(salaInicial);
  const [monto, setMonto] = useState(
    String(salaInicial.piezaActual?.pujaMinima ?? "")
  );
  // 'sala' | 'confirmar' | 'procesando' | 'registrada' | 'superada'
  const [uiState, setUiState] = useState("sala");
  const [miUltimaMonto, setMiUltimaMonto] = useState(null);
  const [mejorNueva, setMejorNueva] = useState(null);
  const sinMaximo = salaInicial.piezaActual?.pujaMaxima === null;

  const wsRef = useRef(null);
  const uiStateRef = useRef(uiState);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);

  // ─── WebSocket (Task 6) ───────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    const wsUrl =
      SERVER_URL.replace(/^http/, "ws") +
      `/v1/realtime/subastas/${subastaId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "puja_nueva") {
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
      } catch (_) {}
    };

    ws.onerror = () => {};

    return () => {
      ws.close();
    };
  }, [subastaId, token, sinMaximo]);

  // ─── Back / salir ─────────────────────────────────────────────────────────

  const handleSalir = useCallback(async () => {
    try { await salirSala(subastaId); } catch (_) {}
    navigation.goBack();
  }, [subastaId, navigation]);

  useEffect(() => {
    if (Platform.OS === "android") {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleSalir();
        return true;
      });
      return () => sub.remove();
    }
  }, [handleSalir]);

  // ─── Puja ─────────────────────────────────────────────────────────────────

  async function handleConfirmar() {
    const montoNum = Number(monto.replace(/\./g, "").replace(",", "."));
    setUiState("procesando");
    try {
      await realizarPuja(subastaId, montoNum);
      setMiUltimaMonto(montoNum);
      setUiState("registrada");
    } catch (error) {
      setUiState("sala");
      Alert.alert("No se pudo registrar la puja", error.message || "Intentá de nuevo.");
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  const pieza = sala.piezaActual;
  const opciones = pieza
    ? calcularOpciones(pieza.mejorOferta, pieza.precioBase)
    : [];

  function renderPuja({ item }) {
    return (
      <View style={styles.pujaFila}>
        <Text style={[styles.pujaPostor, item.esPropia && { color: SALA.verde }]}>
          {item.postorId}
        </Text>
        <Text style={styles.pujaMonto}>{formatMonto(item.monto, moneda)}</Text>
        {item.timestamp && (
          <Text style={styles.pujaTime}>
            {Math.round((Date.now() - new Date(item.timestamp).getTime()) / 1000)}s
          </Text>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSalir}>
          <Text style={styles.backTexto}>← {titulo}</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      {!pieza ? (
        <View style={styles.esperando}>
          <Text style={styles.esperandoTexto}>Esperando inicio de subasta...</Text>
        </View>
      ) : (
        <>
          {/* Info de pieza */}
          <View style={styles.piezaHeader}>
            <Text style={styles.piezaNumero}>Pieza actual #{String(pieza.numeroItem).padStart(3, "0")}</Text>
            <Text style={styles.piezaDesc}>{pieza.descripcion}</Text>
            <View style={styles.preciosRow}>
              <Text style={styles.precioLabel}>
                Base: <Text style={styles.precioValor}>{formatMonto(pieza.precioBase, moneda)}</Text>
              </Text>
              <Text style={styles.precioLabel}>
                Mejor: <Text style={[styles.precioValor, { color: SALA.verde }]}>{formatMonto(pieza.mejorOferta, moneda)}</Text>
              </Text>
            </View>
          </View>

          {/* Últimas pujas */}
          <View style={styles.pujasSeccion}>
            <Text style={styles.pujasLabel}>Últimas pujas</Text>
            <FlatList
              data={pieza.ultimasPujas}
              keyExtractor={(item) => item.id}
              renderItem={renderPuja}
              scrollEnabled={false}
            />
          </View>

          {/* Botón streaming */}
          <TouchableOpacity style={styles.streamingBoton}>
            <Text style={styles.streamingTexto}>Streaming</Text>
          </TouchableOpacity>

          {/* Imagen placeholder */}
          <View style={styles.imagenPlaceholder}>
            <Text style={styles.imagenTexto}>imagen</Text>
          </View>

          {/* Límites */}
          <View style={styles.limitesRow}>
            <Text style={styles.limiteTexto}>Min: {formatMonto(pieza.pujaMinima, moneda)}</Text>
            {pieza.pujaMaxima !== null && (
              <Text style={styles.limiteTexto}>Max: {formatMonto(pieza.pujaMaxima, moneda)}</Text>
            )}
          </View>

          {/* Botones rápidos */}
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

          {/* Input + PUJAR */}
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
        </>
      )}

      {/* ── Overlay: Confirmar puja ── */}
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
            <TouchableOpacity style={styles.modalBotonPrimario} onPress={handleConfirmar}>
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

      {/* ── Overlay: Procesando ── */}
      <Modal visible={uiState === "procesando"} transparent animationType="fade">
        <View style={styles.overlayOscuro}>
          <View style={styles.overlayCirculo}>
            <Text style={styles.overlayPuntos}>···</Text>
          </View>
          <Text style={styles.overlayTexto}>Procesando tu puja</Text>
        </View>
      </Modal>

      {/* ── Overlay: Puja registrada ── */}
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

      {/* ── Overlay: Puja superada ── */}
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
  pujaMonto: { ...typography.bodySmall, color: SALA.texto, fontWeight: "600", marginRight: 12 },
  pujaTime: { ...typography.caption, color: SALA.textoSec, width: 30, textAlign: "right" },

  streamingBoton: {
    alignSelf: "center",
    backgroundColor: SALA.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 12,
  },
  streamingTexto: { ...typography.bodySmall, color: SALA.texto },

  imagenPlaceholder: {
    marginHorizontal: 20,
    height: 140,
    backgroundColor: SALA.surface,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  imagenTexto: { ...typography.body, color: SALA.textoSec },

  limitesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  limiteTexto: { ...typography.caption, color: SALA.textoSec },

  opcionesRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 12 },
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

  // Modal confirmar
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
  modalPieza: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
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

  // Overlays oscuros
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

  // Overlay superada
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
});
```

- [ ] **Verificar en app (requiere subasta en estado `abierta` y pieza en estado `en_subasta` en la base de datos):**
  - Navegar a una subasta en vivo → PreIngreso → "Entrar a la subasta" → SalaScreen se muestra con tema oscuro
  - Se ven el nombre de la pieza, precios base y mejor oferta
  - Lista de últimas pujas aparece
  - Los 3 botones de acceso rápido calculan los montos correctos
  - El botón de streaming está visible (sin acción)
  - Imagen muestra placeholder
  - Botón back llama POST /sala/salir y navega para atrás (ver en logs)

- [ ] **Si no hay subasta activa para probar:** verificar que la sala muestra "Esperando inicio de subasta..." cuando `piezaActual` es null (modificar temporalmente el parámetro de prueba pasando `{ sala: { piezaActual: null }, ... }` desde el navigator).

- [ ] **Commit:**
```
git add frontend/subastasplus/src/screens/auctions/SalaScreen.js
git commit -m "feat: add SalaScreen with auction room layout and WebSocket integration"
```

---

## Task 6: SalaScreen — flujo de puja end-to-end

> Este task no crea código nuevo — verifica el flujo completo de puja en una subasta real.

- [ ] **Verificar flujo de puja completo:**
  1. Escribir un monto válido en el input (mayor a `pujaMinima`) → tap PUJAR
  2. Aparece el modal "Confirmar puja" con el número de pieza y el monto
  3. Tap "Cancelar" → vuelve a la sala sin cambios
  4. Tap PUJAR nuevamente → tap "Confirmar"
  5. Aparece overlay "Procesando tu puja" (si la conexión es lenta se ve por un momento)
  6. Aparece overlay "¡Puja registrada!" con el monto
  7. Desde otro dispositivo/usuario, realizar una puja mayor
  8. Overlay cambia a "Tu puja fue superada" con la nueva mejor oferta y la oferta propia
  9. Tap "Hacer nueva puja" → vuelve a la sala con el input precompletado con la nueva `pujaMinima`

- [ ] **Verificar errores de puja:**
  - Ingresar un monto menor a `pujaMinima` → debería mostrar Alert con "El monto de tu puja es menor al mínimo..."
  - Ingresar un monto mayor a `pujaMaxima` (si aplica) → Alert con mensaje del backend

- [ ] **Verificar botones rápidos:**
  - Tap en "+1%" → el input se completa con `pujaMinima`
  - Tap en "+5%" → input con `mejorOferta + precioBase * 0.05`
  - Tap en "+10%" → input con `mejorOferta + precioBase * 0.1`

- [ ] **Si todo funciona:**
```
git commit -m "feat: sala de subastas flujo completo funcional" --allow-empty
```

---

## Task 7: Actualizar ARQUITECTURA.md

**Archivo:** `frontend/subastasplus/ARQUITECTURA.md`

- [ ] **Agregar las funciones nuevas a la tabla de `src/api/subastas.js`:**

```markdown
| getSala(subastaId) | GET | /subastas/:id/sala |
| realizarPuja(subastaId, monto) | POST | /subastas/:id/pujas |
| salirSala(subastaId) | POST | /subastas/:id/sala/salir |
```

- [ ] **Agregar a las pantallas implementadas:**

```markdown
### src/screens/auctions/PreIngresoScreen.js
Endpoint: GET /subastas/:id/sala

- Recibe `subasta` por route.params (del AuctionDetailScreen)
- Muestra verificación de acceso: categoría del usuario vs. requerida + estado del medio de pago
- `categoriaOK` y `medioPagoOK` se derivan de `subasta.puedeEntrar` y `subasta.razonNoEntrar`
- Botón "Entrar a la subasta" deshabilitado si alguna verificación falla
- Al tocar llama `getSala(subastaId)` → navega a SalaScreen con la respuesta

### src/screens/auctions/SalaScreen.js
Endpoints: GET /subastas/:id/sala (via params), POST /subastas/:id/pujas, POST /subastas/:id/sala/salir

- Tema completamente oscuro (paleta SALA definida localmente)
- Recibe `sala`, `subastaId`, `titulo`, `moneda` por route.params
- WebSocket en `ws://<host>:3000/v1/realtime/subastas/:id?token=<jwt>` para actualizaciones en tiempo real
- Evento `puja_nueva` actualiza `mejorOferta`, `pujaMinima`, `pujaMaxima` y `ultimasPujas` en el estado local
- Máquina de estados: `sala` → `confirmar` → `procesando` → `registrada` → (`superada` si WS detecta nueva puja) → `sala`
- Botones rápidos: +1%, +5%, +10% calculados como `mejorOferta + precioBase * factor`
- Al salir (back o Android back button) llama POST /sala/salir
- Si `piezaActual` es null: muestra "Esperando inicio de subasta..."
```

- [ ] **Agregar a la sección de AuctionsNavigator:**

```markdown
- PreIngreso → PreIngresoScreen
- Sala → SalaScreen
```

- [ ] **Commit:**
```
git add frontend/subastasplus/ARQUITECTURA.md
git commit -m "docs: update ARQUITECTURA with PreIngresoScreen and SalaScreen"
```
