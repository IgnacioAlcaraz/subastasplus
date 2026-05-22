# SubastaPlus — Arquitectura Frontend

## Stack
- *React Native* con *Expo* (~54)
- *React Navigation* — navegación entre pantallas
- *Axios* — llamadas HTTP al backend
- *AsyncStorage* — persistencia local del token
- *expo-constants* — lectura dinámica de la IP del servidor
- *expo-image-picker* — cámara para fotos del DNI

---

## Estructura de carpetas


src/
├── api/          # Funciones de llamada a endpoints, una por dominio
├── components/   # Componentes reutilizables
│   └── common/   # Botones, inputs y otros genéricos
├── constants/    # Colores y tipografía globales
├── context/      # Estado global (sesión del usuario)
├── navigation/   # Navigators (stacks y tabs)
└── screens/      # Pantallas, una carpeta por dominio


---

## Flujo de arranque

Cuando el usuario abre la app:

1. App.js monta el AuthProvider y el NavigationContainer
2. RootNavigator lee AsyncStorage y determina el estado
3. Según el estado muestra el navigator correspondiente (ver máquina de estados)

---

## Constantes

### src/constants/colors.js
Paleta de colores global. Todos los estilos de la app usan estas variables.

| Variable | Valor | Uso |
|---|---|---|
| primary | #14A059 | Botones principales, links, bordes activos |
| primaryDark | #0B3D2E | Variante oscura del primario |
| secondary | #A8E6C3 | Acentos secundarios |
| background | #F8F9FA | Fondo de pantallas |
| surface | #FFFFFF | Fondo de cards e inputs |
| border | #D1D5DB | Bordes de inputs en reposo |
| borderFocus | #14A059 | Borde de input cuando está enfocado |
| textPrimary | #111827 | Texto principal |
| textSecondary | #6B7280 | Texto secundario y labels |
| textDisabled | #9CA3AF | Placeholders |
| error | #EF4444 | Mensajes de error |

### src/constants/typography.js
Estilos de texto reutilizables: h1, h2, h3, body, bodySmall, caption, button, label.

---

## Contexto global

### src/context/AuthContext.js
Maneja la sesión del usuario en toda la app.

*Qué expone:*
- status — estado actual: loading | unauthenticated | pending | requires_clave | authenticated
- token — JWT del usuario logueado
- user — objeto con datos del usuario (id, nombre, apellido, email, categoria, estado, cantidadMediosPago)
- tokenSeguimiento — token de registro pendiente de aprobación
- pendingData — { email, nombre, categoria } cuando el usuario fue aprobado pero no tiene clave
- isAuthenticated — booleano derivado de si hay token
- login(token, user) — guarda JWT, limpia tokenSeguimiento, cambia status a authenticated
- logout() — borra token y usuario
- savePendingRegistration(tokenSeguimiento) — guarda token en AsyncStorage, cambia status a pending

*Por qué existe:* el token y el estado de sesión los necesitan múltiples pantallas y el navigator. Sin context habría que pasarlos como prop por toda la app.

---

## Máquina de estados (AuthContext)

| Estado | Condición | Navigator mostrado |
|---|---|---|
| loading | App recién abre, leyendo AsyncStorage | Spinner |
| unauthenticated | Sin token ni tokenSeguimiento | AuthNavigator |
| pending | Tiene tokenSeguimiento, sin token | AppNavigator (invitado) |
| requires_clave | Token verificado, usuario aprobado sin clave | CreatePasswordScreen |
| authenticated | Tiene JWT | AppNavigator (completo) |

*Transiciones automáticas al abrir la app:*
- Encuentra tokenSeguimiento → llama a POST /registro/verificar-token
  - pendiente_aprobacion → estado pending
  - requiere_clave → estado requires_clave + guarda pendingData
  - ya_activo → borra token → estado unauthenticated
  - Error de red → conserva pending (no pierde el token)

---

## Navegación

### src/navigation/RootNavigator.js
Punto de entrada de la navegación. Rutea según status del AuthContext:
- loading → Spinner
- authenticated → AppNavigator
- pending → AppNavigator (sin token, modo invitado)
- requires_clave → CreatePasswordScreen (directo, sin navigator)
- unauthenticated → AuthNavigator

### src/navigation/AuthNavigator.js
Stack sin header. Pantallas:
- Login → LoginScreen
- Register → RegisterScreen
- ForgotPassword → ForgotPasswordScreen
- VerifyCode → VerifyCodeScreen
- ResetPassword → ResetPasswordScreen
- PendingApproval → PendingApprovalScreen

### src/navigation/AppNavigator.js
Tab navigator. Pantallas:
- Home → HomeScreen
- Auctions → AuctionsNavigator (stack interno)
- Profile → ProfileScreen

### src/navigation/AuctionsNavigator.js
Stack navigator dentro del tab Subastas. Permite navegar al detalle sin perder el tab bar.
- AuctionsList → AuctionsScreen
- AuctionDetail → AuctionDetailScreen
- Catalog → CatalogScreen
- PieceDetail → PieceDetailScreen

---

## API

### src/api/client.js
Instancia de axios configurada con:
- baseURL dinámica usando Constants.expoConfig.hostUri — toma la IP automáticamente de la máquina que corre Expo, funciona en cualquier computadora sin cambiar nada
- Puerto fijo: 3000/v1
- Interceptor de request: inyecta Authorization: Bearer <token> automáticamente
- Interceptor de response: convierte errores del servidor en objetos Error con el mensaje del backend

### src/api/auth.js
| Función | Método | Endpoint |
|---|---|---|
| login(email, password) | POST | /auth/login |
| recuperarClave(email) | POST | /auth/recuperar-clave |
| verificarCodigo(email, codigo) | POST | /auth/verificar-codigo |
| nuevaClave(email, nuevaClave, resetToken) | POST | /auth/nueva-clave |

### src/api/registro.js
| Función | Método | Endpoint |
|---|---|---|
| registroEtapa1(datos) | POST | /registro/etapa1 |
| verificarToken(tokenSeguimiento) | POST | /registro/verificar-token |
| registroEtapa2(tokenSeguimiento, email, clave) | POST | /registro/etapa2 |

### src/api/paises.js
| Función | Método | Endpoint |
|---|---|---|
| getPaises() | GET | /paises |

### src/api/perfil.js
| Función | Método | Endpoint |
|---|---|---|
| getPerfil() | GET | /perfil |
| subirFotoPerfil(base64) | PUT | /perfil/foto |

### src/api/mediosPago.js
| Función | Método | Endpoint |
|---|---|---|
| getMediosPago() | GET | /medios-pago |

### src/api/client.js
Exporta también SERVER_URL (http://<host>:3000) para construir URLs de imágenes sin el prefijo /v1.

### src/api/subastas.js
| Función | Método | Endpoint |
|---|---|---|
| getSubastas(estado, page) | GET | /subastas?estado=<estado>&page=<page> |
| getSubastaById(id) | GET | /subastas/:id |
| getCatalogo(subastaId, page) | GET | /subastas/:id/catalogo |

### src/api/piezas.js
| Función | Método | Endpoint |
|---|---|---|
| getPiezaById(id) | GET | /piezas/:id |

---

## Componentes comunes

### src/components/common/Button.js
Props: title, onPress, variant (primary \| outline), disabled

- primary — fondo verde colors.primary, texto blanco
- outline — fondo transparente, borde gris, texto secundario

### src/components/common/Input.js
Props: label, value, onChangeText, placeholder, secureTextEntry, keyboardType

- Muestra label arriba del campo
- Borde cambia a colors.borderFocus cuando está enfocado
- secureTextEntry para campos de contraseña

### src/components/common/ProfileMenuItem.js
Props: label, onPress

- Fila touchable con texto a la izquierda y chevron › a la derecha
- Usado en ProfileScreen para cada ítem del menú de navegación

---

## Pantallas

### src/screens/auth/LoginScreen.js
Endpoint: POST /auth/login

Flujo:
1. Valida que email y contraseña no estén vacíos
2. Llama a login() de api/auth.js
3. Chequea el estado del usuario devuelto:
   - pendiente_aprobacion → alerta, no deja entrar
   - bloqueado_multa → alerta, no deja entrar
   - aprobado → llama a saveSession(token, usuario) del context
4. El RootNavigator detecta el token nuevo y cambia automáticamente a los tabs

### src/screens/auth/ForgotPasswordScreen.js
Endpoint: POST /auth/recuperar-clave
- Al éxito navega a VerifyCode pasando email

### src/screens/auth/VerifyCodeScreen.js
Endpoint: POST /auth/verificar-codigo
- 6 cajitas OTP con auto-foco entre dígitos
- Countdown de 2:30 para reenviar código
- Al verificar navega a ResetPassword pasando email y resetToken

### src/screens/auth/ResetPasswordScreen.js
Endpoint: POST /auth/nueva-clave
- Recibe email y resetToken como params de navegación
- Al éxito navega a Login

### src/screens/auth/RegisterScreen.js
Endpoint: POST /registro/etapa1
- Picker de países desde GET /paises (modal bottom sheet con lista)
- Fotos del DNI con cámara (expo-image-picker) convertidas a base64
- Pide permiso de cámara antes de abrir
- Al éxito navega a PendingApproval con el tokenSeguimiento

### src/screens/auth/PendingApprovalScreen.js
- Recibe tokenSeguimiento como param de navegación
- Al tocar "Entendido" llama a savePendingRegistration del context
- Guarda el token en AsyncStorage y cambia status a pending
- El RootNavigator cambia automáticamente a AppNavigator (invitado)

### src/screens/auth/CreatePasswordScreen.js
Endpoint: POST /registro/etapa2
- Renderizada directamente por RootNavigator cuando status === 'requires_clave'
- Lee tokenSeguimiento y pendingData del AuthContext (sin props de navegación)
- Muestra badge con categoría asignada por el admin
- Al éxito recibe JWT y queda logueado automáticamente

---

## Backend — endpoints creados durante el desarrollo

### GET /v1/paises
Devuelve todos los países de la tabla paises. Sin autenticación requerida.
- Controller: backend/controllers/paises.controller.js
- Route: backend/routes/paises.js

### Modificaciones al backend existente
- registro.controller.js — verificarToken ahora devuelve categoria cuando el estado es requiere_clave

---

## Pantallas implementadas — app autenticada

### src/screens/home/HomeScreen.js
Endpoints: GET /perfil, GET /medios-pago, GET /subastas?estado=en_vivo, GET /subastas?estado=programada

- Header con fondo primaryDark: saludo con nombre del usuario, badges de categoría y cantidad de medios, campana de notificaciones
- Sección "En vivo ahora": FlatList horizontal de subastas activas, card con título, piezas, categoría, badge de moneda y botón Entrar
- Sección "Próximas": FlatList horizontal de subastas programadas con imagen placeholder, fecha y título
- Los 4 endpoints se llaman en paralelo con Promise.all al montar la pantalla

### src/screens/auctions/AuctionsScreen.js
Endpoints: GET /subastas?estado=en_vivo, GET /subastas?estado=finalizada

- 3 tabs: En vivo / Programadas / Finalizadas
- Carga todas las abierta y todas las finalizada al montar, filtra en frontend por item.estado
- CardSubasta como componente interno: muestra badge EN VIVO o fecha, título, piezas, moneda, botón Entrar
- Botón Entrar navega a AuctionDetail pasando id

### src/screens/auctions/AuctionDetailScreen.js
Endpoint: GET /subastas/:id

- Recibe id por route.params
- Muestra título, badges de categoría y moneda, tabla de info (fecha, hora, ubicación, rematador)
- fecha y hora se parsean del ISO timestamp que devuelve el backend
- Botón "Ver catálogo" conectado → navega a Catalog pasando subastaId y moneda
- Botón "Entrar a subasta" pendiente de conectar

### src/screens/auctions/CatalogScreen.js
Endpoint: GET /subastas/:id/catalogo

- Recibe subastaId y moneda por route.params
- Buscador en frontend filtra por descripción o número de ítem
- Lista de cards con imagen placeholder, número, descripción y precio
- Al tocar navega a PieceDetail pasando id y moneda

### src/screens/auctions/PieceDetailScreen.js
Endpoint: GET /piezas/:id

- Recibe id y moneda por route.params
- Carrusel de imágenes horizontal con pagingEnabled y dots indicadores
- Imágenes construidas con SERVER_URL + path relativo del backend
- Badge "Obra de arte" condicional según esObraDeArte
- Secciones: precio base, historia del artista, subasta asignada (fecha, rematador, ubicación)

### src/screens/profile/ProfileScreen.js
Endpoints: GET /perfil, PUT /perfil/foto, GET /perfil/foto

- Header con fondo primaryDark: avatar circular touchable, nombre completo en blanco, badge de categoría semi-transparente
- Avatar: si el usuario tiene foto (perfil.fotoPerfil truthy) carga GET /perfil/foto con Bearer token en headers; si falla o no hay foto muestra iniciales (nombre[0]+apellido[0]) como fallback
- Al tocar el avatar abre expo-image-picker (galería, recorte cuadrado 1:1, quality 0.7); sube base64 a PUT /perfil/foto y refresca la imagen con un fotoKey timestamp para invalidar caché
- Badge verde (colors.primary) en la esquina inferior derecha del avatar indica que es editable
- Card blanca con ítems de menú (ProfileMenuItem): Medios de pago, Historial compras, Historial ventas, Métricas, Multa a pagar — cada uno navega a su pantalla futura
- Botón "Cerrar sesión" fijo en la parte inferior con Button variant="outline", llama a logout() del AuthContext

---

## Backend — Email Sender (Nodemailer + Gmail)

*Implementado.* Nodemailer con Gmail para dos casos de uso:
1. Código de recuperación de contraseña (POST /auth/recuperar-clave)
2. Notificación de aprobación de cuenta (POST /admin/clientes/:id/aprobar)

*Variables de entorno requeridas en backend/.env:*

MAIL_USER=tucuenta@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx   # Contraseña de aplicación de Google (no la contraseña de la cuenta)


### backend/lib/mailer.js

Transporter de Gmail y dos funciones exportadas:
- enviarCodigoRecuperacion(email, codigo) — email HTML con código OTP de 6 dígitos, expira en 15 min
- enviarAprobacionCliente(email, nombre, categoria) — email de bienvenida post-aprobación con categoría asignada

Llamado desde:
- auth.controller.js → recuperarClave usa await enviarCodigoRecuperacion(email, codigo)
- admin-clientes.controller.js → aprobar usa await enviarAprobacionCliente(...)

---

## Backend — Endpoints disponibles (no todos wired desde el frontend)

### Autenticación y registro

| Endpoint | Auth |
|---|---|
| POST /auth/login | — |
| POST /auth/logout | token |
| POST /auth/refresh | — |
| POST /auth/recuperar-clave | — |
| POST /auth/verificar-codigo | — |
| POST /auth/nueva-clave | — |
| POST /registro/etapa1 | — |
| POST /registro/etapa2 | — |
| POST /registro/verificar-token | — |

### Perfil y datos

| Endpoint | Auth |
|---|---|
| GET /perfil | token |
| PUT /perfil/foto | token |
| GET /perfil/foto | token |
| GET /paises | — |

### Medios de pago

| Endpoint | Auth |
|---|---|
| GET /medios-pago | token |
| GET /medios-pago/:id | token |
| POST /medios-pago/cuenta-nacional | token |
| POST /medios-pago/cuenta-exterior | token |
| POST /medios-pago/tarjeta | token |
| POST /medios-pago/cheque | token |
| DELETE /medios-pago/:id | token |

### Subastas

| Endpoint | Auth |
|---|---|
| GET /subastas | opcional |
| GET /subastas/:id | opcional |
| GET /subastas/:id/catalogo | opcional |
| GET /subastas/:id/sala | token |
| POST /subastas/:id/pujas | token |
| POST /subastas/:id/sala/salir | token |

### Piezas

| Endpoint | Auth |
|---|---|
| GET /piezas/:id | opcional |
| GET /piezas/:id/fotos/:n | — |

### Compras

| Endpoint | Auth |
|---|---|
| GET /compras | token |
| GET /compras/:id | token |
| POST /compras/:id/pagar | token |

### Historial

| Endpoint | Auth |
|---|---|
| GET /historial/participaciones | token |
| GET /historial/participaciones/:id | token |
| GET /historial/participaciones/:id/pujas | token |
| GET /historial/ventas | token |
| GET /historial/metricas | token |

### Multas

| Endpoint | Auth |
|---|---|
| GET /multas | token |
| POST /multas/:id/pagar | token |

### Notificaciones

| Endpoint | Auth |
|---|---|
| GET /notificaciones | token |
| GET /notificaciones/:id | token |
| GET /notificaciones/:id/mensajes | token |
| POST /notificaciones/:id/mensajes | token |

### Solicitudes de venta

| Endpoint | Auth |
|---|---|
| GET /solicitudes-venta | token |
| POST /solicitudes-venta | token |
| GET /solicitudes-venta/:id | token |
| POST /solicitudes-venta/:id/aceptar-condiciones | token |
| GET /solicitudes-venta/:id/poliza | token |
| GET /solicitudes-venta/:id/contactar-aseguradora | token |
| GET /solicitudes-venta/:id/fotos/:n | token |

### Admin

| Endpoint | Auth |
|---|---|
| POST /admin/clientes/:id/aprobar | admin |
| POST /admin/clientes/:id/rechazar | admin |
| POST /admin/medios-pago/:id/verificar | admin |
| POST /admin/solicitudes-venta/:id/revisar | admin |
| POST /admin/solicitudes-venta/:id/aceptar | admin |
| POST /admin/solicitudes-venta/:id/rechazar | admin |
| POST /admin/solicitudes-venta/:id/asignar-subasta | admin |
| POST /admin/solicitudes-venta/:id/seguro | admin |
| POST /admin/subastas | admin |
| PUT /admin/subastas/:id | admin |
| POST /admin/subastas/:id/items | admin |