# SubastaPlus — Arquitectura Frontend

## Stack
- **React Native** con **Expo** (~54)
- **React Navigation** — navegación entre pantallas
- **Axios** — llamadas HTTP al backend
- **AsyncStorage** — persistencia local del token
- **expo-constants** — lectura dinámica de la IP del servidor
- **expo-image-picker** — cámara para fotos del DNI

---

## Estructura de carpetas

```
src/
├── api/          # Funciones de llamada a endpoints, una por dominio
├── components/   # Componentes reutilizables
│   └── common/   # Botones, inputs y otros genéricos
├── constants/    # Colores y tipografía globales
├── context/      # Estado global (sesión del usuario)
├── navigation/   # Navigators (stacks y tabs)
└── screens/      # Pantallas, una carpeta por dominio
```

---

## Flujo de arranque

Cuando el usuario abre la app:

1. `App.js` monta el `AuthProvider` y el `NavigationContainer`
2. `RootNavigator` lee `AsyncStorage` y determina el estado
3. Según el estado muestra el navigator correspondiente (ver máquina de estados)

---

## Constantes

### `src/constants/colors.js`
Paleta de colores global. Todos los estilos de la app usan estas variables.

| Variable | Valor | Uso |
|---|---|---|
| `primary` | `#14A059` | Botones principales, links, bordes activos |
| `primaryDark` | `#0B3D2E` | Variante oscura del primario |
| `secondary` | `#A8E6C3` | Acentos secundarios |
| `background` | `#F8F9FA` | Fondo de pantallas |
| `surface` | `#FFFFFF` | Fondo de cards e inputs |
| `border` | `#D1D5DB` | Bordes de inputs en reposo |
| `borderFocus` | `#14A059` | Borde de input cuando está enfocado |
| `textPrimary` | `#111827` | Texto principal |
| `textSecondary` | `#6B7280` | Texto secundario y labels |
| `textDisabled` | `#9CA3AF` | Placeholders |
| `error` | `#EF4444` | Mensajes de error |

### `src/constants/typography.js`
Estilos de texto reutilizables: `h1`, `h2`, `h3`, `body`, `bodySmall`, `caption`, `button`, `label`.

---

## Contexto global

### `src/context/AuthContext.js`
Maneja la sesión del usuario en toda la app.

**Qué expone:**
- `status` — estado actual: `loading` | `unauthenticated` | `pending` | `requires_clave` | `authenticated`
- `token` — JWT del usuario logueado
- `user` — objeto con datos del usuario (`id`, `nombre`, `apellido`, `email`, `categoria`, `estado`, `cantidadMediosPago`)
- `tokenSeguimiento` — token de registro pendiente de aprobación
- `pendingData` — `{ email, nombre, categoria }` cuando el usuario fue aprobado pero no tiene clave
- `isAuthenticated` — booleano derivado de si hay token
- `login(token, user)` — guarda JWT, limpia tokenSeguimiento, cambia status a `authenticated`
- `logout()` — borra token y usuario
- `savePendingRegistration(tokenSeguimiento)` — guarda token en AsyncStorage, cambia status a `pending`

**Por qué existe:** el token y el estado de sesión los necesitan múltiples pantallas y el navigator. Sin context habría que pasarlos como prop por toda la app.

---

## Máquina de estados (AuthContext)

| Estado | Condición | Navigator mostrado |
|---|---|---|
| `loading` | App recién abre, leyendo AsyncStorage | Spinner |
| `unauthenticated` | Sin token ni tokenSeguimiento | AuthNavigator |
| `pending` | Tiene tokenSeguimiento, sin token | AppNavigator (invitado) |
| `requires_clave` | Token verificado, usuario aprobado sin clave | CreatePasswordScreen |
| `authenticated` | Tiene JWT | AppNavigator (completo) |

**Transiciones automáticas al abrir la app:**
- Encuentra `tokenSeguimiento` → llama a `POST /registro/verificar-token`
  - `pendiente_aprobacion` → estado `pending`
  - `requiere_clave` → estado `requires_clave` + guarda `pendingData`
  - `ya_activo` → borra token → estado `unauthenticated`
  - Error de red → conserva `pending` (no pierde el token)

---

## Navegación

### `src/navigation/RootNavigator.js`
Punto de entrada de la navegación. Rutea según `status` del AuthContext:
- `loading` → Spinner
- `authenticated` → AppNavigator
- `pending` → AppNavigator (sin token, modo invitado)
- `requires_clave` → CreatePasswordScreen (directo, sin navigator)
- `unauthenticated` → AuthNavigator

### `src/navigation/AuthNavigator.js`
Stack sin header. Pantallas:
- `Login` → `LoginScreen`
- `Register` → `RegisterScreen`
- `ForgotPassword` → `ForgotPasswordScreen`
- `VerifyCode` → `VerifyCodeScreen`
- `ResetPassword` → `ResetPasswordScreen`
- `PendingApproval` → `PendingApprovalScreen`

### `src/navigation/AppNavigator.js`
Tab navigator. Pantallas:
- `Home` → `HomeScreen`
- `Auctions` → `AuctionsScreen`
- `Profile` → `ProfileScreen`

---

## API

### `src/api/client.js`
Instancia de axios configurada con:
- `baseURL` dinámica usando `Constants.expoConfig.hostUri` — toma la IP automáticamente de la máquina que corre Expo, funciona en cualquier computadora sin cambiar nada
- Puerto fijo: `3000/v1`
- Interceptor de request: inyecta `Authorization: Bearer <token>` automáticamente
- Interceptor de response: convierte errores del servidor en objetos `Error` con el mensaje del backend

### `src/api/auth.js`
| Función | Método | Endpoint |
|---|---|---|
| `login(email, password)` | POST | `/auth/login` |
| `recuperarClave(email)` | POST | `/auth/recuperar-clave` |
| `verificarCodigo(email, codigo)` | POST | `/auth/verificar-codigo` |
| `nuevaClave(email, nuevaClave, resetToken)` | POST | `/auth/nueva-clave` |

### `src/api/registro.js`
| Función | Método | Endpoint |
|---|---|---|
| `registroEtapa1(datos)` | POST | `/registro/etapa1` |
| `verificarToken(tokenSeguimiento)` | POST | `/registro/verificar-token` |
| `registroEtapa2(tokenSeguimiento, email, clave)` | POST | `/registro/etapa2` |

### `src/api/paises.js`
| Función | Método | Endpoint |
|---|---|---|
| `getPaises()` | GET | `/paises` |

---

## Componentes comunes

### `src/components/common/Button.js`
Props: `title`, `onPress`, `variant` (`primary` \| `outline`), `disabled`

- `primary` — fondo verde `colors.primary`, texto blanco
- `outline` — fondo transparente, borde gris, texto secundario

### `src/components/common/Input.js`
Props: `label`, `value`, `onChangeText`, `placeholder`, `secureTextEntry`, `keyboardType`

- Muestra label arriba del campo
- Borde cambia a `colors.borderFocus` cuando está enfocado
- `secureTextEntry` para campos de contraseña

---

## Pantallas

### `src/screens/auth/LoginScreen.js`
Endpoint: `POST /auth/login`

Flujo:
1. Valida que email y contraseña no estén vacíos
2. Llama a `login()` de `api/auth.js`
3. Chequea el `estado` del usuario devuelto:
   - `pendiente_aprobacion` → alerta, no deja entrar
   - `bloqueado_multa` → alerta, no deja entrar
   - `aprobado` → llama a `saveSession(token, usuario)` del context
4. El `RootNavigator` detecta el token nuevo y cambia automáticamente a los tabs

### `src/screens/auth/ForgotPasswordScreen.js`
Endpoint: `POST /auth/recuperar-clave`
- Al éxito navega a `VerifyCode` pasando `email`

### `src/screens/auth/VerifyCodeScreen.js`
Endpoint: `POST /auth/verificar-codigo`
- 6 cajitas OTP con auto-foco entre dígitos
- Countdown de 2:30 para reenviar código
- Al verificar navega a `ResetPassword` pasando `email` y `resetToken`

### `src/screens/auth/ResetPasswordScreen.js`
Endpoint: `POST /auth/nueva-clave`
- Recibe `email` y `resetToken` como params de navegación
- Al éxito navega a `Login`

### `src/screens/auth/RegisterScreen.js`
Endpoint: `POST /registro/etapa1`
- Picker de países desde `GET /paises` (modal bottom sheet con lista)
- Fotos del DNI con cámara (`expo-image-picker`) convertidas a base64
- Pide permiso de cámara antes de abrir
- Al éxito navega a `PendingApproval` con el `tokenSeguimiento`

### `src/screens/auth/PendingApprovalScreen.js`
- Recibe `tokenSeguimiento` como param de navegación
- Al tocar "Entendido" llama a `savePendingRegistration` del context
- Guarda el token en AsyncStorage y cambia status a `pending`
- El RootNavigator cambia automáticamente a AppNavigator (invitado)

### `src/screens/auth/CreatePasswordScreen.js`
Endpoint: `POST /registro/etapa2`
- Renderizada directamente por `RootNavigator` cuando `status === 'requires_clave'`
- Lee `tokenSeguimiento` y `pendingData` del AuthContext (sin props de navegación)
- Muestra badge con categoría asignada por el admin
- Al éxito recibe JWT y queda logueado automáticamente

---

## Backend — endpoints creados durante el desarrollo

### `GET /v1/paises`
Devuelve todos los países de la tabla `paises`. Sin autenticación requerida.
- Controller: `backend/controllers/paises.controller.js`
- Route: `backend/routes/paises.js`

### Modificaciones al backend existente
- `registro.controller.js` — `verificarToken` ahora devuelve `categoria` cuando el estado es `requiere_clave`
