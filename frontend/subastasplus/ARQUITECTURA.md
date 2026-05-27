# SubastaPlus — Arquitectura Frontend

## Stack
- *React Native* con *Expo* (~54)
- *React Navigation* — navegación entre pantallas
- *Axios* — llamadas HTTP al backend
- *AsyncStorage* — persistencia local del token
- *expo-constants* — lectura dinámica de la IP del servidor
- *expo-image-picker* — cámara para fotos del DNI
- *@react-native-community/netinfo* — detección del estado de conexión a internet

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

1. App.js monta el AuthProvider, el OfflineGate y el NavigationContainer
2. RootNavigator lee AsyncStorage y determina el estado
3. Según el estado muestra el navigator correspondiente (ver máquina de estados)

El OfflineGate envuelve toda la app: detecta la pérdida de conexión y muestra un overlay por encima de cualquier pantalla.

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

### src/constants/mediosPago.js
- BANCOS_ARGENTINA — lista de bancos argentinos comunes para los pickers de CuentaNacionalScreen y ChequeScreen

---

## Contexto global

### src/context/AuthContext.js
Maneja la sesión del usuario en toda la app.

*Qué expone:*
- status — estado actual: loading | unauthenticated | guest | pending | requires_clave | requires_medio_pago | authenticated
- token — JWT del usuario logueado
- user — objeto con datos del usuario (id, nombre, apellido, email, categoria, estado, cantidadMediosPago)
- tokenSeguimiento — token de registro pendiente de aprobación
- pendingData — { email, nombre, categoria } cuando el usuario fue aprobado pero no tiene clave
- isAuthenticated — booleano derivado: status === 'authenticated'
- isGuest — booleano derivado: status === 'pending' || status === 'guest'. Usar en pantallas para omitir llamadas a endpoints que requieren token
- login(token, user) — guarda JWT, limpia tokenSeguimiento, cambia status a authenticated
- logout() — borra token, usuario y auth_status de AsyncStorage
- savePendingRegistration(tokenSeguimiento) — guarda token en AsyncStorage, cambia status a pending
- startMedioPagoOnboarding(token, user) — guarda JWT y persiste auth_status='requires_medio_pago' en AsyncStorage, cambia status a requires_medio_pago
- completeOnboarding() — borra auth_status de AsyncStorage, cambia status a authenticated
- continueAsGuest() — cambia status a guest sin persistencia (ephemeral)
- exitGuest(route?) — escribe el destino en pendingAuthRoute y cambia status a unauthenticated. route puede ser 'Login' (default) o 'Register'

*Persistencia en AsyncStorage:*
- token — JWT del usuario autenticado
- user — objeto JSON con datos del usuario
- tokenSeguimiento — token temporal durante registro pendiente
- auth_status — persiste 'requires_medio_pago' para que restoreSession() lo restaure si el usuario cierra la app durante el onboarding

*Por qué existe:* el token y el estado de sesión los necesitan múltiples pantallas y el navigator. Sin context habría que pasarlos como prop por toda la app.

---

## Máquina de estados (AuthContext)

| Estado | Condición | Navigator mostrado |
|---|---|---|
| loading | App recién abre, leyendo AsyncStorage | Spinner |
| unauthenticated | Sin token ni tokenSeguimiento | AuthNavigator |
| guest | Tocó "Continuar como invitado" en Login (ephemeral, no persiste) | AppNavigator (invitado anónimo) |
| pending | Tiene tokenSeguimiento, esperando aprobación | AppNavigator (invitado pendiente) |
| requires_clave | Token verificado, usuario aprobado sin clave | CreatePasswordScreen |
| requires_medio_pago | JWT obtenido, pero cantidadMediosPago === 0. Estado persistido en AsyncStorage (auth_status) para sobrevivir cierres de app | MedioPagoNavigator |
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
- authenticated | pending | guest → AppNavigator
- requires_clave → CreatePasswordScreen (directo, sin navigator)
- requires_medio_pago → MedioPagoNavigator
- unauthenticated → AuthNavigator

### src/navigation/pendingAuthRoute.js
Módulo singleton de una sola responsabilidad: almacenar el destino de navegación para el próximo mount de AuthNavigator.
- setPendingAuthRoute(route) — escribe el destino ('Login' | 'Register')
- consumePendingAuthRoute() — devuelve el destino y lo resetea a 'Login'
Usado por exitGuest() en AuthContext para que AuthNavigator arranque en la pantalla correcta sin mezclar lógica de navegación en el contexto de auth.

### src/navigation/AuthNavigator.js
Stack sin header. Lee la ruta inicial con consumePendingAuthRoute() al montarse — por defecto 'Login', o 'Register' si el usuario viene de exitGuest('Register').
- Login → LoginScreen
- Register → RegisterScreen
- ForgotPassword → ForgotPasswordScreen
- VerifyCode → VerifyCodeScreen
- ResetPassword → ResetPasswordScreen
- PendingApproval → PendingApprovalScreen

### src/navigation/AppNavigator.js
Tab navigator con 4 tabs. En modo invitado (isGuest del contexto) los tabs Ventas y Perfil interceptan el tap y muestran GuestModal con la variante correspondiente al status actual.
- Home → HomeScreen
- Auctions → AuctionsNavigator (stack interno). Listener custom: resetea al AuctionsList al tocar el tab para evitar quedar en una pantalla de detalle
- Ventas → VentasNavigator (stack interno)
- Profile → ProfileNavigator (stack interno)

### src/navigation/ProfileNavigator.js
Stack navigator dentro del tab Perfil.
- ProfileHome → ProfileScreen
- MediosPago → MediosPagoScreen
- cuenta-nacional → CuentaNacionalScreen
- cuenta-exterior → CuentaExteriorScreen
- tarjeta → TarjetaScreen
- cheque → ChequeScreen
- HistorialVentas → HistorialVentasScreen
- VentaDetalle → VentaDetalleScreen (registrado aquí para que HistorialVentasScreen pueda navegar al detalle sin cruzar tabs; los items "vendida" no tienen botones de acción adicionales)

### src/navigation/AuctionsNavigator.js
Stack navigator dentro del tab Subastas. Permite navegar al detalle sin perder el tab bar.
- AuctionsList → AuctionsScreen
- AuctionDetail → AuctionDetailScreen
- Catalog → CatalogScreen
- PieceDetail → PieceDetailScreen

### src/navigation/MedioPagoNavigator.js
Stack navigator renderizado por RootNavigator cuando status === 'requires_medio_pago'.
- RegistrarMedioPago → RegistrarMedioPagoScreen (selector de tipo)
- cuenta-nacional → CuentaNacionalScreen
- cuenta-exterior → CuentaExteriorScreen
- tarjeta → TarjetaScreen
- cheque → ChequeScreen
- RegistroCompleto → RegistroCompletoScreen

### src/navigation/VentasNavigator.js
Stack navigator dentro del tab Vender.
- VentasList → VentasScreen
- NuevaSolicitudStep1 → NuevaSolicitudStep1Screen
- NuevaSolicitudStep2 → NuevaSolicitudStep2Screen
- ConfirmacionSolicitud → ConfirmacionSolicitudScreen
- VentaDetalle → VentaDetalleScreen
- AceptarCondiciones → AceptarCondicionesScreen
- PolizaSeguro → PolizaSeguroScreen
- ContactarAseguradora → ContactarAseguradoraScreen

---

## API

### src/api/client.js
Instancia de axios configurada con:
- baseURL dinámica usando Constants.expoConfig.hostUri — toma la IP automáticamente de la máquina que corre Expo, funciona en cualquier computadora sin cambiar nada
- Puerto fijo: 3000/v1
- Interceptor de request: inyecta Authorization: Bearer <token> automáticamente
- Interceptor de response: convierte errores del servidor en objetos Error con el mensaje del backend y adjunta el status HTTP en error.status
- Exporta esErrorServidor(error) — devuelve true si error.status >= 500; lo usan las pantallas para decidir si muestran ServerErrorScreen

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
| agregarCuentaNacional({ banco, cbu, cuitCuil, tipoCuenta, titular, alias }) | POST | /medios-pago/cuenta-nacional |
| agregarCuentaExterior({ banco, swift, iban, pais, titular, moneda, alias }) | POST | /medios-pago/cuenta-exterior |
| agregarTarjeta({ numero, titular, vencimiento, codigoSeguridad }) | POST | /medios-pago/tarjeta |
| agregarCheque({ banco, numeroCheque, monto, moneda, fechaEmision }) | POST | /medios-pago/cheque |

### src/api/client.js
Exporta también SERVER_URL (http://<host>:3000) para construir URLs de imágenes sin el prefijo /v1.

### src/api/subastas.js
| Función | Método | Endpoint |
|---|---|---|
| getSubastas(estado, page) | GET | /subastas?estado=<estado>&page=<page> |
| getSubastaById(id) | GET | /subastas/:id |
| getCatalogo(subastaId, page) | GET | /subastas/:id/catalogo |

### src/api/solicitudesVenta.js
| Función | Método | Endpoint |
|---|---|---|
| getSolicitudes(page) | GET | /solicitudes-venta |
| crearSolicitud(data) | POST | /solicitudes-venta |
| getSolicitudById(id) | GET | /solicitudes-venta/:id |
| aceptarCondiciones(id, data) | POST | /solicitudes-venta/:id/aceptar-condiciones |
| contactarAseguradora(id) | GET | /solicitudes-venta/:id/contactar-aseguradora |

### src/api/piezas.js
| Función | Método | Endpoint |
|---|---|---|
| getPiezaById(id) | GET | /piezas/:id |

### src/api/historial.js
| Función | Método | Endpoint |
|---|---|---|
| getHistorialVentas(page) | GET | /historial/ventas?page=<page> |

---

## Componentes comunes

### src/components/common/Button.js
Props: title, onPress, variant (primary \| outline), disabled

- primary — fondo verde colors.primary, texto blanco
- outline — fondo transparente, borde gris, texto secundario

### src/components/common/Input.js
Props: label, value, onChangeText, placeholder, secureTextEntry, keyboardType, error

- Muestra label arriba del campo
- Borde cambia a colors.borderFocus cuando está enfocado
- secureTextEntry para campos de contraseña
- error — texto de error en rojo debajo del campo, borde rojo cuando está presente

### src/components/common/ProfileMenuItem.js
Props: label, onPress

- Fila touchable con texto a la izquierda y chevron › a la derecha
- Usado en ProfileScreen para cada ítem del menú de navegación

### src/components/common/PickerField.js
Props: label, value, onSelect, opciones, error

- Opciones puede ser array de strings o array de `{ label, value }`
- Default a `[]` si no se pasa opciones — evita crash cuando la lista carga de forma asíncrona
- Abre un bottom sheet modal con la lista de opciones
- error — texto de error en rojo debajo del campo, borde rojo cuando está presente
- Usado en CuentaNacionalScreen, CuentaExteriorScreen y AceptarCondicionesScreen

### src/components/common/CardMedioPago.js
Props: item

- Muestra una card con ícono circular, título mascarado (ej: `Cta. HSBC ***890`), subtítulo del tipo, y badge de verificación
- Badge verde "Verificado" si `item.verificado === 'si'`; gris "Pendiente" en caso contrario
- Lógica de título y subtítulo encapsulada por tipo: cuenta_nacional, cuenta_exterior, tarjeta, cheque
- Usado en MediosPagoScreen

### src/components/common/GuestModal.js
Props: visible, onClose, variant ('pending' | 'guest'), onLogin, onRegister

- Modal semitransparente centrado en pantalla con un único árbol JSX
- Textos centralizados en el objeto CONTENT, indexado por variant
- variant 'pending': título "Cuenta en revisión", botón único "Entendido" → onClose
- variant 'guest': título "Acción no disponible", dos botones en fila → "Iniciar Sesión" (onLogin) y "Registrarse" (onRegister)
- Usado en AppNavigator (tabs restringidos) y AuctionDetailScreen ("Entrar a subasta")

### src/components/common/OfflineScreen.js
Props: onRetry

- Pantalla a pantalla completa: círculo gris con X, título "Sin conexión a internet" y botón "Reintentar" (Button verde primary)
- Estilos desde colors.js y typography.js
- onRetry se dispara al tocar "Reintentar" (lo provee OfflineGate)

### src/components/common/ConfirmModal.js
Props: visible, onConfirm, onCancel, title, message, confirmText, cancelText

- Modal reutilizable para confirmar acciones críticas (overlay oscuro, card centrada)
- title (default "¿Estás seguro?"), message (default "Esta acción no se puede deshacer."), confirmText (default "Confirmar"), cancelText (default "Cancelar")
- Título y mensaje alineados a la izquierda; fila de dos botones (Confirmar = Button verde primary, Cancelar = Button outline)
- onConfirm / onCancel manejados por la pantalla que lo usa

### src/components/common/ServerErrorScreen.js
Props: onRetry

- Pantalla a pantalla completa: círculo gris con !, título "Algo salió mal", subtítulo "Hubo un error en el servidor. Intentá de nuevo más tarde." y botón "Reintentar" (Button verde primary)
- Estilos desde colors.js y typography.js
- La renderiza cada pantalla cuando su carga de datos falla con error de servidor (5xx); onRetry vuelve a ejecutar la carga
- Patrón de uso en pantallas: estado errorServidor + función de carga (useCallback); en el catch, si esErrorServidor(error) → setErrorServidor(true), sino Alert como antes
- Wired en todas las pantallas que cargan datos: HomeScreen, AuctionsScreen, AuctionDetailScreen, CatalogScreen, PieceDetailScreen, VentasScreen, VentaDetalleScreen, ProfileScreen, HistorialVentasScreen

### src/components/common/CardHistorialVenta.js
Props: item, onPress

- Fila con thumbnail autenticado (56×56, arraybuffer → base64, fallback gris), nombre del bien, precio neto formateado y fecha
- Precio neto = `precioVenta × (1 − comisiones/100)`, redondeado a entero. Formato: `"US$ 13.376 neto"`. Mapping de moneda: USD → "US$", EUR → "€", GBP → "£"
- Fecha: `fechaCreacion` ISO formateada a `DD/MM/YYYY`
- Imagen cargada con `client.get` + arraybuffer (Bearer token inyectado por el interceptor de client.js)
- Chevron `›` a la derecha
- Usado en HistorialVentasScreen

### src/components/OfflineGate.js
Props: children

- Componente envolvente que detecta el estado de conexión con NetInfo (no es de common/ porque envuelve la app entera, no es un control reutilizable)
- Se suscribe a NetInfo.addEventListener al montar; considera offline cuando isConnected === false o isInternetReachable === false (cubre "WiFi sin internet" y timeouts)
- Estado null (desconocido al arrancar) se trata como online para evitar falsos positivos
- Renderiza children siempre + un overlay (absoluteFill) con OfflineScreen cuando no hay conexión, así la navegación queda montada debajo y no se pierde la pantalla actual
- "Reintentar" llama a NetInfo.refresh(); si vuelve la conexión el overlay desaparece solo
- Montado en App.js envolviendo al NavigationContainer

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

- En modo invitado (isGuest): solo carga subastas, muestra "Bienvenido" y omite llamadas a /perfil y /medios-pago
- Banner amarillo "cuenta en revisión" solo cuando status === 'pending' (no para guest anónimo)
- En modo autenticado: carga los 4 endpoints en paralelo con Promise.all, muestra saludo con nombre, badges de categoría y medios
- Sección "En vivo ahora": FlatList horizontal de subastas activas
- Sección "Próximas": FlatList horizontal de subastas programadas

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
- Botón "Entrar a subasta": muestra GuestModal (variant=status) si isGuest; lógica de sala pendiente de conectar para usuarios autenticados

### src/screens/auctions/CatalogScreen.js
Endpoint: GET /subastas/:id/catalogo

- Recibe subastaId y moneda por route.params
- Buscador en frontend filtra por descripción o número de ítem
- Lista de cards con miniatura (item.imagenPrincipal = /v1/piezas/:id/fotos/0 del backend), número, descripción y precio
- Al tocar navega a PieceDetail pasando id y moneda

### src/screens/auctions/PieceDetailScreen.js
Endpoint: GET /piezas/:id

- Recibe id y moneda por route.params
- Carrusel de imágenes horizontal con pagingEnabled y dots indicadores
- Imágenes construidas con SERVER_URL + path relativo del backend
- Badge "Obra de arte" condicional según esObraDeArte
- Secciones: precio base, historia del artista, subasta asignada (fecha, rematador, ubicación)

### src/screens/ventas/VentasScreen.js
Endpoint: GET /solicitudes-venta

- Tab "Vender" en AppNavigator (4to tab)
- FlatList de solicitudes con card: imagen (foto 0 con Bearer token en header), descripción, badge de estado con color, chevron
- Labels legibles por estado: "Enviada", "En revisión", "Aceptada", "Rechazada", "En subasta", "Vendida", "No vendida"
- Caso especial: `aceptada` + cuentaCobro presente → badge "Esperando entrega"
- FAB "+" navega a NuevaSolicitudStep1
- Pull to refresh

### src/screens/ventas/NuevaSolicitudStep1Screen.js
- Barra de progreso 2 segmentos (paso 1/2)
- Selector de tipo: ScrollView horizontal con chips para los 6 tipos del backend (arte, antiguedad, joya, vehiculo, mueble, otro)
- Inputs: Nombre del bien → nombre_bien, Artista/diseñador → nombreArtista, Descripción → descripcion
- Grid de 6 slots de fotos: slots llenos muestran la imagen con botón × para eliminar, slots vacíos muestran + dashed
- Contador "X/6 min" en rojo cuando faltan fotos
- Fotos desde galería con expo-image-picker (quality: 0.4, exif: false para reducir payload)
- Validación: nombre, descripción y 6 fotos obligatorios antes de avanzar
- Navega a NuevaSolicitudStep2 pasando todos los datos como params

### src/screens/ventas/NuevaSolicitudStep2Screen.js
Endpoint: POST /solicitudes-venta

- Barra de progreso 2 segmentos (paso 2/2, ambos activos)
- Inputs: Historia/contexto → historia, Dueños anteriores → dueniosAnteriores, Curiosidades → curiosidades
- Checkbox "Declaro propiedad y sin impedimento legal" → declaracionPropiedad (obligatorio)
- Al enviar llama a crearSolicitud con todos los datos de step1 + step2
- En éxito navega con replace a ConfirmacionSolicitud

### src/screens/ventas/ConfirmacionSolicitudScreen.js
- Pantalla de éxito: círculo OK, título "Solicitud enviada", subtítulo
- Botón "Ver mis solicitudes" navega a VentasList

### src/screens/ventas/VentaDetalleScreen.js
Endpoint: GET /solicitudes-venta/:id

- Recibe id por route.params
- Usa `useFocusEffect` para recargar los datos cada vez que la pantalla recibe foco (garantiza datos frescos al volver de AceptarCondiciones)
- Carrusel de imágenes con dots (imágenes autenticadas con Bearer token en header de Image)
- renderContenido() cambia el cuerpo según solicitud.estado + campos adicionales:
  - **en_revision:** "Esperando evaluación..." (admin revisando)
  - **aceptada sin cuentaCobro:** propuesta del admin — valor base, comisión, neto, costo envío; botones "Aceptar condiciones" → AceptarCondiciones y "Rechazar propuesta" (sin cargo, Alert de confirmación)
  - **aceptada con cuentaCobro:** "Esperando entrega" — dirección del depósito, condiciones acordadas
  - **rechazada, valorBase==null:** admin rechazó antes de hacer propuesta, sin cargo
  - **rechazada, valorBase!=null, cuentaCobro==null:** cliente rechazó la propuesta, sin cargo
  - **rechazada, valorBase!=null, cuentaCobro!=null:** bien rechazado en depósito, con cargo — card de devolución con costo y dirección
  - **en_subasta:** nombre, subasta asignada (id + título), valor base, comisión, depósito, botón "Ver póliza de seguro" → PolizaSeguro
  - **vendida:** nombre + "vendido!", precio de venta (mejor_oferta), comisión, neto, CBU enmascarado (***últimos 4)
  - **no_vendida:** empresa compró al base (valorBase), comisión y neto

### src/screens/ventas/AceptarCondicionesScreen.js
Endpoint: POST /solicitudes-venta/:id/aceptar-condiciones

- Recibe solicitud completa por route.params
- Info card: Valor base, Comisión %, Neto calculado (valorBase × (1 − comisiones/100)), Costo de envío
- Tabs "Cta. nacional" / "Cta. exterior" para elegir tipo de cuenta de cobro
- Nacional: CBU (22 dígitos, requerido), Banco (PickerField con BANCOS_ARGENTINA, requerido), Titular (requerido)
- Exterior: SWIFT (requerido), IBAN (requerido), País (PickerField desde GET /paises sin Argentina, requerido), Moneda (PickerField USD/EUR/GBP, requerido), Banco (texto libre, requerido), Titular (requerido)
- Al confirmar exitoso: `navigation.goBack()` → vuelve a VentaDetalle que recarga automáticamente vía useFocusEffect

### src/screens/ventas/PolizaSeguroScreen.js
Endpoint: ninguno propio — recibe poliza por route.params desde VentaDetalleScreen

- Muestra: #nroPoliza (heading), aseguradora (subtítulo), Tipo, Importe (bold), Beneficiario (nombre + apellido del user en AuthContext), "Vigente"
- Botón "Contactar aseguradora" → navega a ContactarAseguradora pasando solicitudId

### src/screens/ventas/ContactarAseguradoraScreen.js
Endpoint: GET /solicitudes-venta/:id/contactar-aseguradora

- Carga contacto de la aseguradora al montar
- Muestra: nombre aseguradora (h2), teléfono, email, web, número de póliza

### src/screens/mediosPago/RegistrarMedioPagoScreen.js
Sin endpoint propio — es un selector estático con 4 opciones que navegan a los formularios correspondientes.
- Primera pantalla de MedioPagoNavigator (solo en el flujo de onboarding)
- El flujo desde perfil usa MediosPagoScreen en su lugar (con FAB + modal)
- Opciones: Cuenta bancaria nacional, Cuenta bancaria extranjera, Cheque certificado, Tarjeta de crédito

### src/screens/mediosPago/CuentaNacionalScreen.js
Endpoint: POST /medios-pago/cuenta-nacional

- Formulario: CBU (22 dígitos), Banco (picker), Tipo de cuenta (picker: caja_ahorro | cuenta_corriente), Titular, CUIT/CUIL, Alias (opcional)
- CBU: solo acepta dígitos, máximo 22. CUIT/CUIL: auto-formato XX-XXXXXXXX-X al tipear
- Validaciones: CBU exactamente 22 dígitos, CUIT/CUIL exactamente 11 dígitos
- Errores inline bajo cada campo
- Al éxito navega a `route.params?.successRoute ?? 'RegistroCompleto'`

### src/screens/mediosPago/CuentaExteriorScreen.js
Endpoint: POST /medios-pago/cuenta-exterior

- Formulario: IBAN, SWIFT/BIC, Banco (texto libre), País del banco (picker), Moneda (picker: USD | EUR | GBP), Titular
- SWIFT: se convierte automáticamente a mayúsculas al tipear
- Validaciones: SWIFT 8-11 caracteres, todos los campos requeridos
- Errores inline bajo cada campo
- Al éxito navega a `route.params?.successRoute ?? 'RegistroCompleto'`

### src/screens/mediosPago/ChequeScreen.js
Endpoint: POST /medios-pago/cheque

- Formulario: Nro de cheque, Banco emisor (picker), Monto certificado, Moneda (picker: ARS | USD), Fecha de emisión
- Fecha de emisión: auto-formato AAAA-MM-DD al tipear (solo números, guiones automáticos)
- Validaciones: monto > 0, fecha en formato AAAA-MM-DD válido
- Errores inline bajo cada campo
- Al éxito navega a `route.params?.successRoute ?? 'RegistroCompleto'`

### src/screens/mediosPago/TarjetaScreen.js
Endpoint: POST /medios-pago/tarjeta

- Formulario: Número, Titular, Código de seguridad (CVV, secureTextEntry), Vencimiento (MM/AA)
- Número: auto-formato en grupos de 4 (XXXX XXXX XXXX XXXX), se envía sin espacios al backend
- Vencimiento: auto-formato MM/AA al tipear (barra automática tras el mes)
- Validaciones: 16 dígitos, CVV 3-4 dígitos, mes 01-12
- El CVV nunca se persiste en el backend — solo se usan los últimos 4 dígitos del número
- Errores inline bajo cada campo
- Al éxito navega a `route.params?.successRoute ?? 'RegistroCompleto'`

### src/screens/mediosPago/RegistroCompletoScreen.js
Sin endpoint — lee categoría del usuario desde AuthContext.

- Pantalla de bienvenida post-onboarding: círculo OK, título, categoría y cantidad de medios
- Botón "Comenzar" llama completeOnboarding() → status pasa a authenticated → RootNavigator muestra AppNavigator

### src/screens/profile/ProfileScreen.js
Endpoints: GET /perfil, PUT /perfil/foto, GET /perfil/foto

- Header con fondo primaryDark: avatar circular touchable, nombre completo en blanco, badge de categoría semi-transparente
- Avatar: si el usuario tiene foto (perfil.fotoPerfil truthy) carga GET /perfil/foto con Bearer token en headers; si falla o no hay foto muestra iniciales (nombre[0]+apellido[0]) como fallback
- Al tocar el avatar abre expo-image-picker (cámara, recorte cuadrado 1:1, quality 0.5); sube base64 a PUT /perfil/foto y refresca la imagen
- Badge verde (colors.primary) en la esquina inferior derecha del avatar indica que es editable
- Card blanca con ítems de menú (ProfileMenuItem): Medios de pago navega a MediosPagoScreen; el resto (Historial compras, Historial ventas, Métricas, Multa a pagar) pendientes de conectar
- Botón "Cerrar sesión" fijo en la parte inferior (Button variant="danger") abre un ConfirmModal ("Cerrar sesión" / "¿Querés cerrar tu sesión?...", confirmText "Cerrar"); al confirmar llama a logout() del AuthContext

### src/screens/profile/HistorialVentasScreen.js
Endpoint: GET /historial/ventas

- Accesible desde ProfileScreen → ítem "Historial ventas"
- FlatList de bienes vendidos (solo estado `vendida`) usando CardHistorialVenta; pull to refresh
- Estado vacío: "Aún no tenés ventas registradas"
- Al tocar un item navega a VentaDetalle (registrado en ProfileNavigator)
- ServerErrorScreen en error 5xx

### src/screens/mediosPago/MediosPagoScreen.js
Endpoint: GET /medios-pago

- Accesible desde ProfileScreen → ítem "Medios de pago"
- FlatList de medios registrados usando CardMedioPago; pull to refresh
- Estado vacío: texto "Sin medios de pago / Tocá + para agregar uno"
- FAB "+" en la esquina inferior derecha abre un Modal bottom sheet con 4 opciones
- Cada opción navega al formulario correspondiente pasando `{ successRoute: 'MediosPago' }` para que al guardar vuelva a esta lista

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

**Cambio en GET /historial/ventas:** filtra solo `estado = "vendida"`. Cada item incluye `precioVenta` (número, la mejor oferta ganadora vía `items_catalogo_estado.mejor_oferta`) y `moneda` (string de la subasta asignada).

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