# Flujo de autenticación — SubastasPlus

## Mecanismo base: React Context

### Por qué existe

Las pantallas (LoginScreen, HomeScreen, etc.) están en distintos componentes del árbol de React. No pueden simplemente importar una variable y modificarla — cada componente tiene su propio scope. React Context es el mecanismo oficial para **compartir estado entre componentes sin pasarlo como props uno por uno**.

### Cómo funciona en el código

**Paso 1 — crear el canal** (`AuthContext.js` línea 6):
```js
const AuthContext = createContext(null);
```
Esto crea el canal vacío. El `null` es solo el valor por defecto si alguien usara `useContext` sin tener un `AuthProvider` arriba — en la práctica nunca pasa.

**Paso 2 — llenar el canal** (`AuthContext.js` línea 118):
```js
// AuthProvider retorna esto en su render:
<AuthContext.Provider value={{ status, token, user, login, logout, ... }}>
  {children}
</AuthContext.Provider>
```
Cuando `AuthProvider` renderiza, el `value` llena el canal con el estado actual. Cada vez que un `useState` interno cambia (por ejemplo `setStatus('authenticated')`), React re-renderiza `AuthProvider`, el `value` se actualiza, y **todos los componentes que estén suscritos reciben el nuevo valor automáticamente**.

**Paso 3 — leer el canal** (cualquier pantalla):
```js
const { status, token, login } = useAuth();
```
`useAuth()` es un wrapper de `useContext(AuthContext)` que agrega una validación:
```js
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

---

## Jerarquía de la app

En `App.js`:
```
AuthProvider              ← monta el canal y lo llena con status, token, etc.
  └── NavigationContainer ← motor de React Navigation, uno solo en toda la app
        └── RootNavigator ← selector condicional, NO es un navigator real
```

### RootNavigator — el selector

`RootNavigator` **no es un Stack ni un Tab navigator**. No registra pantallas con `<Stack.Screen>`. Es un componente React normal que lee `status` del canal y hace if/return:

```js
export default function RootNavigator() {
  const { status } = useAuth(); // suscripto al canal

  if (status === 'loading') return <ActivityIndicator />;

  if (['authenticated', 'pending', 'guest'].includes(status)) return <AppNavigator />;
  if (status === 'requires_clave')       return <CreatePasswordScreen />;
  if (status === 'requires_medio_pago')  return <MedioPagoNavigator />;
  return <AuthNavigator />;
}
```

Cuando `status` cambia, React re-renderiza `RootNavigator`, desmonta el mundo anterior y monta el nuevo. No hay `navigate()` — es puro renderizado condicional.

### Los navigators reales

Estos sí usan `createStackNavigator` o `createBottomTabNavigator` y manejan historial de pantallas:

| Navigator | Tipo | Pantallas |
|---|---|---|
| `AuthNavigator` | Stack | Login, Register, ForgotPassword, VerifyCode, ResetPassword, PendingApproval |
| `AppNavigator` | Bottom Tabs | Home, AuctionsNavigator, VentasNavigator, ProfileNavigator |
| `AuctionsNavigator` | Stack | AuctionsList, AuctionDetail, Catalog, PieceDetail, PreIngreso, Sala + flujo compra |
| `VentasNavigator` | Stack | VentasList, NuevaSolicitudStep1/2, ConfirmacionSolicitud, VentaDetalle, etc. |
| `ProfileNavigator` | Stack | ProfileHome, MediosPago, HistorialVentas, Multas, HistorialCompras, Metricas, etc. |
| `MedioPagoNavigator` | Stack | RegistrarMedioPago, CuentaNacional, CuentaExterior, Tarjeta, Cheque, RegistroCompleto |

> **Por qué el flujo de compra aparece en AuctionsNavigator Y en ProfileNavigator:** React Navigation no puede navegar entre tabs manteniendo el historial. Si el flujo de compra solo estuviera en Subastas y se accede desde Perfil, el contexto se pierde. La solución es duplicar esas pantallas en cada navigator que las necesite.

---

## Estado inicial y variables del contexto

Cuando `AuthProvider` monta por primera vez, los `useState` inicializan todo vacío:

```js
const [status, setStatus]                 = useState('loading');
const [token, setToken]                   = useState(null);
const [user, setUser]                     = useState(null);
const [tokenSeguimiento, setTokenSeguimiento] = useState(null);
const [pendingData, setPendingData]       = useState(null);
```

| Variable | Qué contiene cuando está llena |
|---|---|
| `status` | String que define el mundo actual (ver tabla más abajo) |
| `token` | JWT string para llamadas autenticadas al backend |
| `user` | Objeto con datos del usuario (`id`, `nombre`, `email`, etc.) |
| `tokenSeguimiento` | Token del proceso de registro en curso |
| `pendingData` | Email/nombre/categoría del usuario aprobado que aún no creó clave |

Valores derivados que el canal también expone (calculados, no guardados):
```js
isAuthenticated: status === 'authenticated',
isGuest: status === 'pending' || status === 'guest',
```

---

## Qué hay en AsyncStorage

AsyncStorage es el almacenamiento persistente del dispositivo. Sobrevive cierres de app. El contexto (RAM) se pierde al cerrar; AsyncStorage no.

| Key | Cuándo existe | Qué contiene |
|---|---|---|
| `token` | Después de login exitoso | JWT string |
| `user` | Después de login exitoso | JSON con datos del usuario |
| `auth_status` | Solo durante onboarding de medio de pago | `'requires_medio_pago'` |
| `tokenSeguimiento` | Después de enviar registro hasta completar el proceso | Token de seguimiento |

---

## Qué pasa cuando abrís la app

### 1. Estado inicial → spinner

`AuthProvider` monta con `status = 'loading'`. El canal se llena con ese valor. `RootNavigator` lee el canal, entra en el primer if y muestra el spinner. La app está "parada" visualmente acá.

### 2. `restoreSession()` corre

```js
useEffect(() => { restoreSession(); }, []);
```

`useEffect` con array vacío `[]` se ejecuta una sola vez después del primer render. Lee AsyncStorage y sigue uno de tres caminos:

---

#### Camino A — hay `token` guardado
El usuario ya había hecho login antes y no cerró sesión.

```js
const savedToken  = await AsyncStorage.getItem('token');      // "eyJhbGci..."
const savedUser   = await AsyncStorage.getItem('user');       // '{"id":5,"nombre":"Juan"}'
const savedStatus = await AsyncStorage.getItem('auth_status'); // null o 'requires_medio_pago'

if (savedToken) {
  setToken(savedToken);
  setUser(JSON.parse(savedUser));
  setStatus(savedStatus === 'requires_medio_pago' ? 'requires_medio_pago' : 'authenticated');
  return; // sale, no sigue leyendo
}
```

No llama al backend — restaura directo desde AsyncStorage.

`setStatus(...)` actualiza el canal → `RootNavigator` se re-renderiza:
- Si quedó `'authenticated'` → `AppNavigator` (tabs completos)
- Si quedó `'requires_medio_pago'` → `MedioPagoNavigator` (onboarding de pago)

---

#### Camino B — no hay `token`, hay `tokenSeguimiento`
El usuario había arrancado el registro pero no lo completó.

```js
const savedTokenSeg = await AsyncStorage.getItem('tokenSeguimiento');
if (savedTokenSeg) {
  try {
    const result = await verificarToken(savedTokenSeg); // POST /registro/verificar-token

    if (result.estado === 'pendiente_aprobacion') {
      setTokenSeguimiento(savedTokenSeg);
      setStatus('pending');

    } else if (result.estado === 'requiere_clave') {
      setTokenSeguimiento(savedTokenSeg);
      setPendingData({ email: result.email, nombre: result.nombre, categoria: result.categoria });
      setStatus('requires_clave');

    } else if (result.estado === 'ya_activo') {
      await AsyncStorage.removeItem('tokenSeguimiento'); // ya no sirve
      setStatus('unauthenticated');
    }
  } catch (_) {
    // si falla la red, queda como pending — no tiene sentido desloguearlo
    setTokenSeguimiento(savedTokenSeg);
    setStatus('pending');
  }
  return;
}
```

| `result.estado` | Qué significa | Resultado |
|---|---|---|
| `pendiente_aprobacion` | Admin todavía no aprobó | `AppNavigator` con tabs Vender y Perfil bloqueados |
| `requiere_clave` | Admin aprobó, falta crear contraseña | `CreatePasswordScreen` directo |
| `ya_activo` | Completó el proceso (quizás en otro dispositivo), tiene cuenta activa pero no el JWT en este dispositivo | `LoginScreen` — tiene que hacer login normal |

---

#### Camino C — AsyncStorage vacío
Primera vez, o el usuario cerró sesión.

```js
setStatus('unauthenticated');
```

→ `RootNavigator` cae al `return <AuthNavigator />` del final → `LoginScreen`.

---

## Flujo Login

El usuario completa el formulario. `LoginScreen` llama al endpoint. Si el backend responde exitosamente y el usuario ya tiene medios de pago, la pantalla llama a `login()`:

```js
async function login(tokenValue, userData) {
  await AsyncStorage.setItem('token', tokenValue);             // persiste el JWT
  await AsyncStorage.setItem('user', JSON.stringify(userData)); // persiste los datos
  await AsyncStorage.removeItem('tokenSeguimiento');            // limpia si había registro pendiente
  setToken(tokenValue);
  setUser(userData);
  setTokenSeguimiento(null);
  setPendingData(null);
  setStatus('authenticated'); // ← canal se actualiza → RootNavigator → AppNavigator
}
```

Si el backend indica que no tiene medios de pago, se llama `startMedioPagoOnboarding()` en vez de `login()`:

```js
async function startMedioPagoOnboarding(tokenValue, userData) {
  await AsyncStorage.setItem('token', tokenValue);
  await AsyncStorage.setItem('user', JSON.stringify(userData));
  await AsyncStorage.setItem('auth_status', 'requires_medio_pago'); // flag especial
  await AsyncStorage.removeItem('tokenSeguimiento');
  setToken(tokenValue);
  setUser(userData);
  setStatus('requires_medio_pago'); // → RootNavigator → MedioPagoNavigator
}
```

El flag `auth_status` en AsyncStorage garantiza que si el usuario cierra la app durante el onboarding, al reabrir vuelva a `MedioPagoNavigator` (Camino A lo detecta). Cuando completa el onboarding:

```js
async function completeOnboarding() {
  await AsyncStorage.removeItem('auth_status'); // borra el flag
  setStatus('authenticated'); // → RootNavigator → AppNavigator
}
```

---

## Flujo Registro

El usuario llena el formulario con foto de DNI. El backend crea el registro y devuelve un `tokenSeguimiento`. La pantalla llama a `savePendingRegistration()`:

```js
async function savePendingRegistration(tokenSeg) {
  await AsyncStorage.setItem('tokenSeguimiento', tokenSeg); // persiste
  setTokenSeguimiento(tokenSeg);
  setStatus('pending'); // → RootNavigator → AppNavigator (modo bloqueado)
}
```

El usuario queda en `pending`: puede navegar por Home y Subastas, pero Vender y Perfil están bloqueados.

Cuando el admin aprueba al usuario en el panel: la próxima apertura de la app, `restoreSession()` llama a `verificarToken` que devuelve `requiere_clave`. El contexto hace:
```js
setPendingData({ email, nombre, categoria }); // datos para pre-llenar CreatePasswordScreen
setStatus('requires_clave'); // → RootNavigator → CreatePasswordScreen
```

El usuario crea su contraseña. El backend devuelve el JWT. La pantalla llama a `login()` → `status = 'authenticated'` → `AppNavigator`.

---

## Flujo Invitado

El usuario toca "Continuar como invitado" en `LoginScreen`:

```js
// LoginScreen.js
const { continueAsGuest } = useAuth();
<Button title="Continuar como invitado" onPress={continueAsGuest} />

// AuthContext.js
function continueAsGuest() {
  setStatus('guest'); // solo RAM, nada en AsyncStorage
}
```

`setStatus('guest')` actualiza el canal → `RootNavigator` re-renderiza → `AppNavigator`.

**Si cierra la app y la vuelve a abrir**: AsyncStorage vacío → Camino C → `unauthenticated` → `LoginScreen`. El modo invitado no persiste.

### Bloqueo de tabs en AppNavigator

`AppNavigator` lee `isGuest` del canal y bloquea los tabs Vender y Perfil con un listener:

```js
const { status, isGuest, exitGuest } = useAuth();
const [modalVisible, setModalVisible] = useState(false);

function guestListener() {
  return {
    tabPress: (e) => {
      if (isGuest) {
        e.preventDefault();    // cancela la navegación al tab
        setModalVisible(true); // muestra el GuestModal encima
      }
    },
  };
}

<Tab.Screen name="Ventas"   listeners={guestListener()} />
<Tab.Screen name="Profile"  listeners={guestListener()} />
```

Home y Subastas no tienen `guestListener()` — se puede navegar libremente.

### GuestModal — dos variantes

```js
<GuestModal
  visible={modalVisible}
  variant={status}        // pasa 'guest' o 'pending'
  onLogin={() => { setModalVisible(false); exitGuest('Login'); }}
  onRegister={() => { setModalVisible(false); exitGuest('Register'); }}
/>
```

`GuestModal` usa `variant` para decidir qué mostrar:

```js
const CONTENT = {
  guest:   { titulo: 'Acción no disponible',  descripcion: '...' },
  pending: { titulo: 'Cuenta en revisión',    descripcion: '...' },
};

// y para los botones:
{variant === 'guest' ? (
  // "Iniciar Sesión" + "Registrarse"
) : (
  // solo "Entendido"
)}
```

### Salir del modo invitado

Si el usuario toca "Registrarse" en el modal:

```js
// AppNavigator.js
onRegister={() => { setModalVisible(false); exitGuest('Register'); }}

// AuthContext.js
function exitGuest(route = 'Login') {
  setPendingAuthRoute(route);    // guarda 'Register' en una variable de módulo (RAM)
  setStatus('unauthenticated'); // canal se actualiza → RootNavigator → AuthNavigator
}
```

`pendingAuthRoute.js` es un módulo con una variable en RAM (no AsyncStorage):

```js
let pendingRoute = 'Login';

export function setPendingAuthRoute(route) { pendingRoute = route; }

export function consumePendingAuthRoute() {
  const route = pendingRoute;
  pendingRoute = 'Login'; // resetea después de leerlo
  return route;
}
```

`AuthNavigator` lo usa como pantalla inicial:

```js
<Stack.Navigator initialRouteName={consumePendingAuthRoute()}>
  // devuelve 'Register' → arranca en RegisterScreen
  // devuelve 'Login'    → arranca en LoginScreen (default)
```

El usuario aterriza directo en `RegisterScreen` sin pasar por Login.

---

## Logout

```js
async function logout() {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('auth_status');
  setToken(null);
  setUser(null);
  setStatus('unauthenticated'); // → RootNavigator → AuthNavigator → LoginScreen
}
```

Limpia todo de AsyncStorage y RAM. `tokenSeguimiento` no se limpia en el logout — si hubiera uno sería de un registro distinto al del usuario logueado, pero en la práctica ambos no coexisten.

---

## Mapa de estados

```
                        ┌──────────────────────────────────┐
         app abre       │           'loading'               │
        ─────────────►  │  spinner mientras lee AsyncStorage│
                        └──────────────┬───────────────────┘
                                       │
              ┌────────────────────────┼──────────────────────────┐
              │ token en AS            │ tokenSeg en AS            │ nada en AS
              ▼                        ▼                           ▼
    ┌──────────────────┐   POST /verificar-token          ┌───────────────┐
    │  'authenticated' │◄── ya_activo ──────────────────► │'unauthenticated│
    │  o               │                                  │  LoginScreen  │
    │'requires_medio   │   pendiente_aprobacion               └──────┬────┘
    │   _pago'         │        │                                    │
    └──────────────────┘        ▼                         continuar  │  login()
                         ┌─────────────┐                 como        │
                         │  'pending'  │                 invitado    │
                         │  AppNav     │◄────────────────────────────┤
                         │  bloqueado  │                             │
                         └─────────────┘                    ┌────────▼──────┐
                                                            │    'guest'    │
                              requiere_clave                │   AppNav      │
                                   │                        │   bloqueado   │
                                   ▼                        └───────────────┘
                         ┌──────────────────┐
                         │'requires_clave'  │
                         │CreatePassword    │
                         │Screen            │
                         └────────┬─────────┘
                                  │ login()
                                  ▼
                         ┌──────────────────┐
                         │  'authenticated' │
                         │   AppNavigator   │
                         │   completo       │
                         └──────────────────┘
```
