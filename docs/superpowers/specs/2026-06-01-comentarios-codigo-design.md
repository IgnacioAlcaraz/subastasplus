# Diseño: Agregar comentarios al código

**Fecha:** 2026-06-01

## Objetivo

Agregar comentarios en español, estilo casual y simple (como si los hubiera escrito el desarrollador del proyecto), solo en los archivos donde la lógica no es obvia.

## Estilo

- Español, tono informal, primera persona o neutro
- Cortos: una línea máximo
- Explican el POR QUÉ, no el qué
- Ejemplos:
  ```js
  // si no hay token guardado, arrancamos como no autenticado
  // si falla la red preferimos mantenerlo como pending, no tiene sentido desloguearlo
  // el interceptor agrega el JWT a cada request automáticamente
  ```

## Archivos a comentar

### Frontend

| Archivo | Razón |
|---|---|
| `src/context/AuthContext.js` | Máquina de estados compleja con 7 estados |
| `src/api/client.js` | Interceptors de axios + manejo de errores |
| `src/navigation/RootNavigator.js` | Routing condicional por estado de auth |
| `src/navigation/AppNavigator.js` | Tabs con modo guest/invitado |
| `src/navigation/MedioPagoNavigator.js` | Onboarding flow |
| `src/navigation/AuctionsNavigator.js` | Navegación anidada de subastas |
| `src/navigation/pendingAuthRoute.js` | Módulo de navegación no obvio |
| `src/screens/ventas/NuevaSolicitudStep1Screen.js` | Flow multi-paso |
| `src/screens/ventas/NuevaSolicitudStep2Screen.js` | Flow multi-paso |
| `src/screens/ventas/AceptarCondicionesScreen.js` | Lógica de aceptación |
| `src/screens/auctions/SalaScreen.js` | Lógica de sala de subastas en vivo |
| `src/screens/auctions/PreIngresoScreen.js` | Pre-ingreso con validaciones |
| `src/components/OfflineGate.js` | Lógica de estado de red |
| `src/components/common/GuestModal.js` | Lógica de variante guest/pending |

### Backend

| Archivo | Razón |
|---|---|
| `backend/controllers/auth.controller.js` | Validaciones y generación de JWT |
| `backend/controllers/registro.controller.js` | Flujo de registro con estados |
| `backend/controllers/compras.controller.js` | Transacciones y estados de compra |
| `backend/controllers/multas.controller.js` | Lógica de multas |
| `backend/controllers/solicitudes-venta.controller.js` | Estados de solicitudes |

## Archivos que se saltean

- `constants/colors.js`, `typography.js`, `mediosPago.js` — solo datos
- `Button.js`, `Input.js`, `ProfileMenuItem.js` — componentes simples
- API files que solo llaman a axios sin lógica extra
- Pantallas que solo renderizan UI sin lógica especial

## Criterio de decisión

Un archivo merece comentario si:
1. Tiene lógica condicional que no es obvia (ej: "¿por qué mantenemos pending en error de red?")
2. Tiene efectos secundarios no evidentes
3. Tiene una decisión de diseño que podría sorprender a alguien que lee el código por primera vez
