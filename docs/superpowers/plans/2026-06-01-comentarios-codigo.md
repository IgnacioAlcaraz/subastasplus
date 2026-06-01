# Comentarios en el código — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar comentarios en español, casual y simples, en los archivos donde la lógica no es obvia.

**Architecture:** Cada tarea modifica un grupo de archivos relacionados con Edit, agrega los comentarios específicos indicados, y hace commit. No hay tests. No se agregan comentarios en archivos donde el código se explica solo.

**Tech Stack:** React Native/Expo (frontend), Node.js/Express (backend)

---

### Task 1: Frontend — AuthContext y client

**Files:**
- Modify: `frontend/subastasplus/src/context/AuthContext.js`
- Modify: `frontend/subastasplus/src/api/client.js`

- [ ] **Step 1: Agregar comentarios en AuthContext.js**

En `frontend/subastasplus/src/context/AuthContext.js`:

```js
// línea 24 — antes del if (savedToken):
// si hay JWT guardado, restauramos la sesión directo sin llamar al backend

// línea 33 — antes del if (savedTokenSeg):
// sin JWT, vemos si quedó un token de registro en curso

// línea 47 — mejorar el catch existente (reemplazar):
} catch (_) {
  // si falla la red preferimos mantenerlo como pending, no tiene sentido desloguearlo
  setTokenSeguimiento(savedTokenSeg);
  setStatus('pending');
}

// línea 72 — antes de startMedioPagoOnboarding, en el async function:
// guardamos el status en AsyncStorage por si la app se cierra durante el onboarding

// línea 84 — antes de completeOnboarding:
// borramos el flag para que la próxima apertura entre como autenticado normal

// línea 108 — antes del body de exitGuest:
// guardamos la ruta destino antes de volver a unauthenticated, así el navigator sabe a dónde ir

// línea 128 — antes de isGuest:
// tanto guest como pending se bloquean igual; la diferencia está en el texto del modal
```

Cambios exactos a aplicar con Edit:

Reemplazar:
```js
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');

      if (savedToken) {
```
Con:
```js
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');

      // si hay JWT guardado, restauramos la sesión directo sin llamar al backend
      if (savedToken) {
```

Reemplazar:
```js
      const savedTokenSeg = await AsyncStorage.getItem('tokenSeguimiento');
      if (savedTokenSeg) {
```
Con:
```js
      // sin JWT, vemos si quedó un token de registro en curso
      const savedTokenSeg = await AsyncStorage.getItem('tokenSeguimiento');
      if (savedTokenSeg) {
```

Reemplazar:
```js
        } catch (_) {
          // Error de red: mantener pending para no perder el token
          setTokenSeguimiento(savedTokenSeg);
          setStatus('pending');
        }
```
Con:
```js
        } catch (_) {
          // si falla la red preferimos mantenerlo como pending, no tiene sentido desloguearlo
          setTokenSeguimiento(savedTokenSeg);
          setStatus('pending');
        }
```

Reemplazar:
```js
  async function startMedioPagoOnboarding(tokenValue, userData) {
    await AsyncStorage.setItem('token', tokenValue);
```
Con:
```js
  // guardamos el status en AsyncStorage por si la app se cierra durante el onboarding
  async function startMedioPagoOnboarding(tokenValue, userData) {
    await AsyncStorage.setItem('token', tokenValue);
```

Reemplazar:
```js
  async function completeOnboarding() {
    await AsyncStorage.removeItem('auth_status');
```
Con:
```js
  // borramos el flag para que la próxima apertura entre como autenticado normal
  async function completeOnboarding() {
    await AsyncStorage.removeItem('auth_status');
```

Reemplazar:
```js
  function exitGuest(route = 'Login') {
    setPendingAuthRoute(route);
```
Con:
```js
  // guardamos la ruta destino antes de volver a unauthenticated, así el navigator sabe a dónde ir
  function exitGuest(route = 'Login') {
    setPendingAuthRoute(route);
```

Reemplazar:
```js
      isAuthenticated: status === 'authenticated',
      isGuest: status === 'pending' || status === 'guest',
```
Con:
```js
      isAuthenticated: status === 'authenticated',
      // tanto guest como pending se bloquean igual; la diferencia está en el texto del modal
      isGuest: status === 'pending' || status === 'guest',
```

- [ ] **Step 2: Agregar comentarios en client.js**

Reemplazar:
```js
const devHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
```
Con:
```js
// sacamos la IP del host de Expo para conectar al backend en la misma red local
const devHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
```

Reemplazar:
```js
client.interceptors.request.use(async (config) => {
```
Con:
```js
// agrega el JWT a cada request automáticamente si hay sesión activa
client.interceptors.request.use(async (config) => {
```

Reemplazar:
```js
client.interceptors.response.use(
  (response) => response,
  (error) => {
```
Con:
```js
// estandarizamos el error para que todas las pantallas reciban siempre un mensaje legible
client.interceptors.response.use(
  (response) => response,
  (error) => {
```

- [ ] **Step 3: Commit**

```bash
git add frontend/subastasplus/src/context/AuthContext.js frontend/subastasplus/src/api/client.js
git commit -m "docs: comentarios en AuthContext y client"
```

---

### Task 2: Frontend — Navigation

**Files:**
- Modify: `frontend/subastasplus/src/navigation/RootNavigator.js`
- Modify: `frontend/subastasplus/src/navigation/AppNavigator.js`
- Modify: `frontend/subastasplus/src/navigation/pendingAuthRoute.js`
- Modify: `frontend/subastasplus/src/navigation/MedioPagoNavigator.js`

- [ ] **Step 1: Agregar comentarios en RootNavigator.js**

Reemplazar:
```js
  if (['authenticated', 'pending', 'guest'].includes(status)) return <AppNavigator />;
```
Con:
```js
  // authenticated, pending y guest comparten el AppNavigator; la diferencia es qué tabs están desbloqueados
  if (['authenticated', 'pending', 'guest'].includes(status)) return <AppNavigator />;
```

- [ ] **Step 2: Agregar comentarios en AppNavigator.js**

Reemplazar:
```js
  function guestListener() {
    return {
      tabPress: (e) => {
        if (isGuest) {
```
Con:
```js
  // intercepta el tap del tab y muestra el modal en vez de navegar si es invitado
  function guestListener() {
    return {
      tabPress: (e) => {
        if (isGuest) {
```

Reemplazar:
```js
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Auctions', { screen: 'AuctionsList' });
            },
          })}
```
Con:
```js
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // siempre volvemos al listado al tocar el tab, aunque ya estés adentro de una subasta
              e.preventDefault();
              navigation.navigate('Auctions', { screen: 'AuctionsList' });
            },
          })}
```

- [ ] **Step 3: Agregar comentarios en pendingAuthRoute.js**

Reemplazar el contenido completo del archivo:
```js
// guarda la pantalla a la que debe ir el usuario después de autenticarse
// se usa cuando un guest o pending toca algo bloqueado y elige registrarse o iniciar sesión
let pendingRoute = 'Login';

export function setPendingAuthRoute(route) {
  pendingRoute = route;
}

export function consumePendingAuthRoute() {
  const route = pendingRoute;
  // reseteamos a Login después de leerlo para que el próximo exit vaya al default
  pendingRoute = 'Login';
  return route;
}
```

- [ ] **Step 4: Agregar comentarios en MedioPagoNavigator.js**

Reemplazar:
```js
export default function MedioPagoNavigator() {
```
Con:
```js
// este navigator se usa solo durante el onboarding obligatorio de medios de pago
// después del onboarding el acceso es desde el perfil (ProfileNavigator)
export default function MedioPagoNavigator() {
```

- [ ] **Step 5: Commit**

```bash
git add frontend/subastasplus/src/navigation/RootNavigator.js frontend/subastasplus/src/navigation/AppNavigator.js frontend/subastasplus/src/navigation/pendingAuthRoute.js frontend/subastasplus/src/navigation/MedioPagoNavigator.js
git commit -m "docs: comentarios en navigators"
```

---

### Task 3: Frontend — Components

**Files:**
- Modify: `frontend/subastasplus/src/components/OfflineGate.js`
- Modify: `frontend/subastasplus/src/components/common/GuestModal.js`

- [ ] **Step 1: Agregar comentarios en OfflineGate.js**

Reemplazar:
```js
function estaOffline(state) {
  if (!state) return false;
  return state.isConnected === false || state.isInternetReachable === false;
}
```
Con:
```js
function estaOffline(state) {
  if (!state) return false;
  // chequeamos ambas propiedades porque en algunos dispositivos isInternetReachable puede ser null y no false
  return state.isConnected === false || state.isInternetReachable === false;
}
```

Reemplazar:
```js
  return (
    <View style={styles.root}>
      {children}
      {offline && (
        <View style={styles.overlay}>
```
Con:
```js
  return (
    <View style={styles.root}>
      {children}
      {/* superponemos la pantalla offline encima del contenido sin desmontarlo */}
      {offline && (
        <View style={styles.overlay}>
```

- [ ] **Step 2: Agregar comentarios en GuestModal.js**

Reemplazar:
```js
const CONTENT = {
```
Con:
```js
// dos variantes del modal: guest = invitado anónimo, pending = registro enviado esperando aprobación
const CONTENT = {
```

Reemplazar:
```js
  const { titulo, descripcion } = CONTENT[variant] ?? CONTENT.pending;
```
Con:
```js
  // si llega una variante desconocida caemos a pending como default más conservador
  const { titulo, descripcion } = CONTENT[variant] ?? CONTENT.pending;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/subastasplus/src/components/OfflineGate.js frontend/subastasplus/src/components/common/GuestModal.js
git commit -m "docs: comentarios en components OfflineGate y GuestModal"
```

---

### Task 4: Frontend — Screens de subastas

**Files:**
- Modify: `frontend/subastasplus/src/screens/auctions/PreIngresoScreen.js`
- Modify: `frontend/subastasplus/src/screens/auctions/SalaScreen.js`

- [ ] **Step 1: Agregar comentarios en PreIngresoScreen.js**

Reemplazar:
```js
  const categoriaOK =
    subasta.puedeEntrar || subasta.razonNoEntrar !== "Categoría insuficiente";
  const medioPagoOK =
    subasta.puedeEntrar || subasta.razonNoEntrar === "Categoría insuficiente";
  const puedeEntrar = categoriaOK && medioPagoOK;
```
Con:
```js
  // el backend nos dice si puede entrar y por qué no; acá descomponemos la razón para mostrar cada check
  const categoriaOK =
    subasta.puedeEntrar || subasta.razonNoEntrar !== "Categoría insuficiente";
  const medioPagoOK =
    subasta.puedeEntrar || subasta.razonNoEntrar === "Categoría insuficiente";
  const puedeEntrar = categoriaOK && medioPagoOK;
```

- [ ] **Step 2: Agregar comentarios en SalaScreen.js**

Reemplazar:
```js
const SALA = {
```
Con:
```js
// la sala de subastas tiene su propia paleta oscura, separada del tema general de la app
const SALA = {
```

Reemplazar:
```js
function calcularOpciones(mejorOferta, precioBase) {
```
Con:
```js
// los incrementos rápidos se calculan como porcentaje del precio base, no de la oferta actual
function calcularOpciones(mejorOferta, precioBase) {
```

Reemplazar:
```js
  const uiStateRef = useRef(uiState);
  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);
```
Con:
```js
  // necesitamos el ref porque el handler del WebSocket captura el closure inicial y no ve updates del estado
  const uiStateRef = useRef(uiState);
  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);
```

Reemplazar:
```js
    const wsUrl =
      SERVER_URL.replace(/^http/, "ws") +
```
Con:
```js
    // convertimos el URL de http a ws para la conexión en tiempo real
    const wsUrl =
      SERVER_URL.replace(/^http/, "ws") +
```

Reemplazar:
```js
        if (msg.event === "puja_nueva") {
          setSala((prev) => {
```
Con:
```js
        if (msg.event === "puja_nueva") {
          // actualizamos la sala con la nueva oferta y recalculamos los límites de puja
          setSala((prev) => {
```

Reemplazar:
```js
        if (msg.event === "pieza_cerrada") {
          if (msg.ganadorClienteId && String(msg.ganadorClienteId) === user?.id) {
```
Con:
```js
        if (msg.event === "pieza_cerrada") {
          // comparamos con el id del usuario para saber si ganamos o perdimos la pieza
          if (msg.ganadorClienteId && String(msg.ganadorClienteId) === user?.id) {
```

Reemplazar:
```js
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
```
Con:
```js
    // en Android necesitamos interceptar el botón físico de atrás para llamar a salirSala correctamente
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
```

- [ ] **Step 3: Commit**

```bash
git add frontend/subastasplus/src/screens/auctions/PreIngresoScreen.js frontend/subastasplus/src/screens/auctions/SalaScreen.js
git commit -m "docs: comentarios en PreIngresoScreen y SalaScreen"
```

---

### Task 5: Frontend — Screens de ventas

**Files:**
- Modify: `frontend/subastasplus/src/screens/ventas/NuevaSolicitudStep1Screen.js`
- Modify: `frontend/subastasplus/src/screens/ventas/NuevaSolicitudStep2Screen.js`
- Modify: `frontend/subastasplus/src/screens/ventas/AceptarCondicionesScreen.js`

- [ ] **Step 1: Agregar comentarios en NuevaSolicitudStep1Screen.js**

Reemplazar:
```js
        quality: 0.4,
        base64: true,
```
Con:
```js
        quality: 0.4, // reducimos la calidad para que las fotos en base64 no exploten el payload
        base64: true,
```

- [ ] **Step 2: Agregar comentarios en AceptarCondicionesScreen.js**

Reemplazar:
```js
function validarNacional({ cbu, banco, titular }) {
```
Con:
```js
// validamos localmente antes de mandar al backend para dar feedback inmediato al usuario
function validarNacional({ cbu, banco, titular }) {
```

Reemplazar:
```js
function validarExterior({ swift, iban, banco, pais, moneda, titular }) {
```
Con:
```js
// misma lógica para cuenta exterior; el SWIFT puede tener 8 u 11 caracteres según el banco
function validarExterior({ swift, iban, banco, pais, moneda, titular }) {
```

- [ ] **Step 3: Agregar comentarios en NuevaSolicitudStep2Screen.js**

Reemplazar:
```js
  const step1 = route.params;
```
Con:
```js
  // recibimos todos los datos del step 1 como params de navegación
  const step1 = route.params;
```

Reemplazar:
```js
      navigation.replace('ConfirmacionSolicitud');
```
Con:
```js
      // replace en vez de navigate para que no puedan volver al step2 desde la confirmación
      navigation.replace('ConfirmacionSolicitud');
```

- [ ] **Step 4: Commit**

```bash
git add frontend/subastasplus/src/screens/ventas/NuevaSolicitudStep1Screen.js frontend/subastasplus/src/screens/ventas/NuevaSolicitudStep2Screen.js frontend/subastasplus/src/screens/ventas/AceptarCondicionesScreen.js
git commit -m "docs: comentarios en screens de ventas"
```

---

### Task 6: Backend — Auth Controllers

**Files:**
- Modify: `backend/controllers/auth.controller.js`
- Modify: `backend/controllers/registro.controller.js`

- [ ] **Step 1: Agregar comentarios en auth.controller.js**

Reemplazar:
```js
  const [cantidadMediosPago, tieneMulta] = await Promise.all([
```
Con:
```js
  // traemos medios de pago y multas en paralelo para no hacer las dos consultas en serie
  const [cantidadMediosPago, tieneMulta] = await Promise.all([
```

Reemplazar:
```js
  const codigo = tokens.randomCode();
  const expiracion = new Date(Date.now() + 15 * 60 * 1000).toISOString();
```
Con:
```js
  const codigo = tokens.randomCode();
  // el código de recuperación vence en 15 minutos
  const expiracion = new Date(Date.now() + 15 * 60 * 1000).toISOString();
```

Reemplazar:
```js
  const acceso = email ? await ClientesAcceso.findOne({ email }) : null;
  const invalid = () => {
```
Con:
```js
  // no distinguimos entre "código incorrecto" y "código expirado" para no dar pistas
  const acceso = email ? await ClientesAcceso.findOne({ email }) : null;
  const invalid = () => {
```

- [ ] **Step 2: Agregar comentarios en registro.controller.js**

Reemplazar:
```js
function base64ToBytea(b64) {
```
Con:
```js
// convierte base64 a bytea (formato de PostgreSQL para binarios)
function base64ToBytea(b64) {
```

Reemplazar:
```js
  const documento = `PENDING-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
```
Con:
```js
  // el documento real no lo tenemos todavía; el admin lo valida cuando revisa el DNI
  const documento = `PENDING-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
```

Reemplazar:
```js
  const tokenPlano = tokens.randomToken("tok");
  const tokenHash = tokens.sha256(tokenPlano);
```
Con:
```js
  // guardamos solo el hash en la base de datos; el token plano solo va en la respuesta
  const tokenPlano = tokens.randomToken("tok");
  const tokenHash = tokens.sha256(tokenPlano);
```

Reemplazar:
```js
  if (!acceso) {
    // El hash puede haberse borrado si etapa2 ya corrió. Intentar por email para dar mejor error.
```
Con:
```js
  if (!acceso) {
    // el hash se borra cuando se completa el registro; intentamos por email para dar un error más claro
```

Reemplazar:
```js
  await ClientesAcceso.update(acceso.identificador, {
    password_hash: hash,
    token_seguimiento_hash: null,
  });
```
Con:
```js
  // borramos el token de seguimiento una vez que el registro se completó, ya no sirve
  await ClientesAcceso.update(acceso.identificador, {
    password_hash: hash,
    token_seguimiento_hash: null,
  });
```

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/auth.controller.js backend/controllers/registro.controller.js
git commit -m "docs: comentarios en auth y registro controllers"
```

---

### Task 7: Backend — Business Controllers

**Files:**
- Modify: `backend/controllers/compras.controller.js`
- Modify: `backend/controllers/multas.controller.js`
- Modify: `backend/controllers/solicitudes-venta.controller.js`

- [ ] **Step 1: Agregar comentarios en compras.controller.js**

Leer el archivo completo y agregar comentarios en:

- Antes de `let estadoApi = "pendiente_pago"`: `// mapeamos el estado interno a los valores que espera el frontend`
- Antes de `avisoSeguro`: `// el aviso de seguro solo aplica cuando el usuario elige retirar en persona`
- Antes de `const from = (page - 1) * limit` en `listar`: `// paginación con supabase usando range`

Cambios exactos:

En `compraShape`, reemplazar:
```js
  let estadoApi = "pendiente_pago";
```
Con:
```js
  // mapeamos el estado interno a los valores que espera el frontend
  let estadoApi = "pendiente_pago";
```

Reemplazar:
```js
    avisoSeguro:
      ext?.metodo_entrega === "retiro_personal"
```
Con:
```js
    // el aviso de seguro solo aplica cuando el usuario elige retirar en persona
    avisoSeguro:
      ext?.metodo_entrega === "retiro_personal"
```

- [ ] **Step 2: Agregar comentarios en multas.controller.js**

Reemplazar:
```js
async function multasDelUsuario(clienteId) {
  const { data: registros } = await supabase
    .from("registro_de_subasta")
```
Con:
```js
// las multas no tienen FK directa al cliente; las traemos indirectamente a través de sus registros de subasta
async function multasDelUsuario(clienteId) {
  const { data: registros } = await supabase
    .from("registro_de_subasta")
```

Reemplazar:
```js
  if (medio.tipo === "cheque_certificado" && Number(medio.monto_cheque || 0) < Number(multa.monto_multa || 0)) {
```
Con:
```js
  // solo para cheques verificamos que el monto cubra la multa; otros medios se validan en el banco
  if (medio.tipo === "cheque_certificado" && Number(medio.monto_cheque || 0) < Number(multa.monto_multa || 0)) {
```

- [ ] **Step 3: Agregar comentarios en solicitudes-venta.controller.js**

Leer el archivo completo y luego agregar:

Reemplazar:
```js
async function buildPoliza(nroPoliza) {
  if (!nroPoliza) return null;
  const seguro = await Seguros.findById(nroPoliza);
  if (!seguro) return null;
  const ext = await SegurosExtension.findOne({ nro_poliza: nroPoliza });
  const p = polizaShape(seguro);
  p.contactoAseguradora = ext?.telefono || ext?.email || null;
  return p;
}
```
Con:
```js
// la póliza tiene datos base en seguros y datos de contacto en la extensión; los unimos acá
async function buildPoliza(nroPoliza) {
  if (!nroPoliza) return null;
  const seguro = await Seguros.findById(nroPoliza);
  if (!seguro) return null;
  const ext = await SegurosExtension.findOne({ nro_poliza: nroPoliza });
  const p = polizaShape(seguro);
  p.contactoAseguradora = ext?.telefono || ext?.email || null;
  return p;
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/compras.controller.js backend/controllers/multas.controller.js backend/controllers/solicitudes-venta.controller.js
git commit -m "docs: comentarios en business controllers"
```
