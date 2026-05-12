# Diferencias entre el Swagger y la DB

Este documento registra cada divergencia encontrada entre el contrato de la API
(definido en [`swagger.yaml`](swagger.yaml)) y el schema real de la DB en
Supabase. Para cada item: qué dice el spec, qué dice la DB, y cómo lo
resolvemos en el código.

> Mantener al día: cada vez que aparezca una nueva diferencia, agregar una
> entrada nueva con fecha al final.

---

## 1. Identificadores: `uuid` vs `integer`

- **Spec:** todos los `id` son `string` con `format: uuid`.
- **DB:** los PKs son `integer` (auto-increment en la mayoría, manual en otros).
- **Resolución:** los controllers convierten a string en el response
  (`String(cliente.identificador)`). Sin pérdida de funcionalidad, pero quien
  consuma la API recibirá `"1"`, `"42"`, etc., no UUIDs reales.

## 2. Auto-increment NO está en todas las tablas

- **Auto-increment (SERIAL):** `sectores`, `personas`, `clientes_acceso`,
  `subastas`, `catalogos`, `items_catalogo`, `productos`, `pujos`,
  `medios_pago`, etc.
- **NO auto-increment** (hay que proveer el id explícito):
  - `paises.numero` — tabla de referencia (usamos ISO 3166 numeric, ej. AR=32).
  - `empleados.identificador` — al crear el primer admin tuvimos que calcular
    `MAX(id)+1`.
  - `clientes.identificador` — es a la vez PK **y** FK a `personas`, así que
    siempre se pasa el mismo valor que `personas.identificador`.
  - `duenios.identificador` — idem clientes, FK a `personas`.
  - `subastadores.identificador` — idem.
  - Todas las tablas `*_extension` cuyo PK es el FK a la tabla principal.
- **Resolución:** `models/base.js` `create()` intenta primero sin id; si la DB
  devuelve `null value in column "identificador"`, recalcula `MAX(pk)+1` y
  reintenta. Para los casos donde el id debe coincidir con otro FK (clientes,
  duenios, etc.), el controller lo pasa explícito.

## 3. Nombre + apellido

- **Spec:** `UsuarioResumen.nombre` y `UsuarioResumen.apellido` por separado.
- **DB:** `personas.nombre VARCHAR(150)` único.
- **Resolución:** [`lib/usuario-shape.js`](lib/usuario-shape.js)
  - `joinNombre(nombre, apellido)` al escribir.
  - `splitNombre(full)` al leer — splitea por el primer espacio.
  - **Limitación:** apellidos compuestos sin partícula podrían leerse mal
    (ej. "Maria Lopez Perez" → nombre="Maria", apellido="Lopez Perez").

## 4. `personas.documento` tiene VARCHAR(20)

- **Spec:** no especifica longitud.
- **DB:** `VARCHAR(20)`.
- **Resolución:** en `/registro/etapa1` generamos placeholders del tipo
  `PENDING-<12 hex>` (exactamente 20 chars). El seed usa documentos
  cortos como `"99999999"`.

## 5. `personas.estado` tiene CHECK constraint `chk_estado`

- **Spec:** no expone el estado de `personas`.
- **DB:** `VARCHAR(15)` con CHECK que rechaza `"pendiente"`. Acepta `"activo"`.
  (No tenemos lista completa de valores válidos todavía.)
- **Resolución:** siempre insertamos con `estado: "activo"` en `personas`.
  Si necesitamos otros estados, hay que probar contra el CHECK o pedir el DDL
  del constraint.

## 6. `clientes.admitido` (2 chars) vs `usuario.estado` (enum spec)

- **Spec:** `UsuarioResumen.estado` enum
  `pendiente_aprobacion | aprobado | bloqueado_multa | bloqueado_judicial`.
- **DB:** `clientes.admitido VARCHAR(2)` con valores `'si'` o `'no'`. No hay
  columnas para bloqueos.
- **Resolución:**
  [`lib/usuario-shape.js::deriveEstado()`](lib/usuario-shape.js):
  - `admitido='no'` → `pendiente_aprobacion`
  - `admitido='si'` + sin multa activa → `aprobado`
  - `admitido='si'` + multa activa → `bloqueado_multa`
  - `bloqueado_judicial` **queda fuera de scope** (no hay tabla para ello).

## 7. Multas: sin FK directa cliente → multa

- **Spec:** `usuario.estado=bloqueado_multa`.
- **DB:** `multas.registro` apunta a `registro_de_subasta`, no a `clientes`.
  Hay que derivar via `registro_de_subasta.cliente` para saber si un cliente
  tiene multas.
- **Resolución actual:** se computa como `tieneMultaActiva=false` (placeholder).
  Cuando se implemente el módulo Multas, agregamos la query JOIN.

## 8. `subastas.estado`: CHECK solo permite `'abierta'` / `'cerrada'`

- **Spec:** `SubastaResumen.estado` enum
  `programada | en_vivo | finalizada`.
- **DB:** CHECK `chk_es` solo acepta `'abierta'` y `'cerrada'`.
- **Resolución:** [`lib/subasta-shape.js`](lib/subasta-shape.js):
  - `estadoApi(subasta)`: DB → API
    - `cerrada` → `finalizada`
    - `abierta` + `fecha === today` → `en_vivo`
    - `abierta` + `fecha > today` → `programada`
  - `estadoApiToDb(apiEstado)`: API → DB (para filtros `?estado=`)
    - `finalizada` → `cerrada`
    - `en_vivo` o `programada` → `abierta`
- **Limitación:** No podemos distinguir realmente `en_vivo` de `programada`
  porque `subastas.fecha` no puede ser `today` (ver siguiente diff). En `/sala`
  aceptamos cualquier subasta `abierta` como "en vivo".

## 9. `subastas.fecha`: CHECK `chk_fecha` exige fecha lejana

- **Spec:** no especifica restricción.
- **DB:** CHECK rechaza `today` y dates "demasiado cercanas". En las pruebas:
  - `2026-05-13` (mañana, contra system date 2026-05-12) → rechazado.
  - `2026-06-01` (+20 días) → aceptado.
  - Aplica también en UPDATE, no solo INSERT.
- **Resolución:** el seed usa `today + 30 días`. Para tests futuros de
  "finalizada", no hay forma vía API de marcar una subasta como pasada (la DB
  bloquea cambiar la fecha a `today`).

## 10. `subastas.titulo` no existe en la DB

- **Spec:** `SubastaResumen.titulo` (ej. `"Arte Moderno #47"`).
- **DB:** sin campo.
- **Resolución:** [`lib/subasta-shape.js::tituloSubasta()`](lib/subasta-shape.js):
  - Si `subastas_extension.es_coleccion='si'` → usa `nombre_coleccion`.
  - Si no → `"Subasta #{identificador}"`.

## 11. `subastas.fecha` (DATE) + `subastas.hora` (TIME) → un solo timestamp en la API

- **Spec:** `SubastaResumen.fecha` con `format: date-time` (timestamp único).
- **DB:** dos columnas separadas (`DATE` + `TIME WITHOUT TIME ZONE`).
- **Resolución:**
  [`lib/subasta-shape.js::fechaTimestamp()`](lib/subasta-shape.js) concatena
  con `new Date(`${fecha}T${hora}`).toISOString()`.

## 12. Fotos como `bytea` vs URLs en el Swagger

- **Spec:** `imagenPrincipal` y `imagenes` son `string` con `format: uri`. Para
  `dniFrente`/`dniDorso` el spec dice `format: binary` (multipart típico).
- **DB:** todas las fotos son `bytea` inline (`personas.foto`,
  `productos.fotos.foto`, `fotos_documento.foto_frente/foto_dorso`).
- **Resolución actual:**
  - En **input** (registro etapa1): aceptamos base64 en JSON y convertimos
    a hex (`\x...`) antes de mandar a PostgREST. Helper
    `base64ToBytea()` en [`controllers/registro.controller.js`](controllers/registro.controller.js).
  - En **output**: `imagenPrincipal` y `imagenes` por ahora se devuelven como
    `null` / `[]`. Falta crear un endpoint del tipo
    `GET /v1/productos/:id/fotos/:n` que sirva los bytes con el
    `Content-Type` correspondiente.

## 13. `cantidadMediosPago` del usuario

- **Spec:** propiedad de `UsuarioResumen`.
- **DB:** no es columna, hay que contar `medios_pago WHERE cliente = X`.
- **Resolución:** [`controllers/auth.controller.js::buildLoginResponse()`](controllers/auth.controller.js)
  hace un `count()` antes de armar la respuesta.

## 14. `categoria` del cliente: enum vs varchar libre

- **Spec:** `CategoriaUsuario` enum
  `comun | especial | plata | oro | platino`.
- **DB:** `clientes.categoria VARCHAR(10)` sin CHECK observado (acepta lo que
  pongamos). El seed y registro siempre crean con `'comun'`.
- **Resolución:** el código respeta el enum, pero la DB no lo enforce — si
  alguien hace un UPDATE manual a `'foo'`, la API lo va a devolver tal cual.

## 15. Sin "verificador" automático

- **Spec:** no menciona el verificador.
- **DB:** `clientes.verificador` (FK a `empleados`) es **NOT NULL**.
- **Resolución:** `/registro/etapa1` toma el id del empleado admin desde
  `process.env.ADMIN_EMPLEADO_ID`. El seed lo crea y avisa qué valor poner en
  el `.env`.

## 16. `pujos` (sic, sin "a") y `pujos_extension`

- **Spec:** habla de "pujas" (con A).
- **DB:** la tabla se llama `pujos` y la extension `pujos_extension`.
- **Resolución:** los nombres de URL y campos del API siguen el spec
  (`/pujas`, `PujaResponse`), pero los models internos respetan el nombre real
  de la tabla (`models/pujos.js`).

## 17. `pujos_extension.timestamp` vive aparte

- **Spec:** `PujaResumen.timestamp` es un campo plano.
- **DB:** `pujos` no tiene timestamp; está en `pujos_extension.timestamp`.
- **Resolución:** cuando creamos una puja insertamos ambos rows (uno en
  `pujos`, otro en `pujos_extension`) y al leerlas hacemos JOIN manual.

## 18. RLS está activo

- **Spec:** no aplica (es config de Supabase).
- **DB:** Row Level Security activado, la `anon` key no puede escribir.
- **Resolución:** el backend usa la `service_role` key
  ([`supabase-client.js`](supabase-client.js)). **Nunca exponer al cliente.**

## 19. `medios_pago.tipo` — CHECK matches spec ✓

- **Spec:** enum `cuenta_nacional | cuenta_exterior | tarjeta_credito | cheque_certificado`.
- **DB:** CHECK `chk_tipo_medio` acepta exactamente esos cuatro valores.
- **Resolución:** ninguna, alineado al spec.

## 20. `medios_pago.verificado` es `varchar(2)` 'si'/'no', no boolean

- **Spec:** `MedioPago.verificado: boolean`.
- **DB:** `VARCHAR(2)` con CHECK `chk_verificado` que solo acepta `'si'` o
  `'no'` (case-sensitive, lowercase).
- **Resolución:**
  [`lib/medio-pago-shape.js::medioPagoShape()`](lib/medio-pago-shape.js)
  mapea `verificado === 'si'` → `true`. Al insertar siempre usamos `'no'`
  (los medios nacen sin verificar).

## 21. `medios_pago.moneda` es `varchar(3)` sin CHECK

- **Spec:** enum `ARS | USD` en `MedioPago`, `USD | EUR | GBP` en
  `CrearCuentaExteriorRequest`, `ARS | USD` en `CrearChequeRequest`.
- **DB:** `VARCHAR(3)` **sin CHECK**. Acepta cualquier código de 3 chars.
- **Resolución:** la validación de moneda se hace en el controller según el
  endpoint (`agregarCuentaExterior` exige `USD/EUR/GBP`, `agregarCheque`
  exige `ARS/USD`). DB no enforce nada.

## 22. `medios_pago.tipo_cuenta` — CHECK matches spec ✓

- **Spec:** enum `caja_ahorro | cuenta_corriente`.
- **DB:** CHECK `chk_tipo_cuenta` acepta exactamente esos dos valores.
- **Resolución:** ninguna, alineado al spec.

## 23. Tarjeta: número completo y CVV no se persisten

- **Spec:** `CrearTarjetaRequest` exige `numero`, `codigoSeguridad`,
  `vencimiento`. Pero `MedioPago` solo expone `ultimosDigitos`.
- **DB:** no hay columnas para `numero` completo, ni `CVV`, ni `vencimiento`.
- **Resolución:** validamos Luhn + vencimiento en el controller, guardamos
  únicamente `ultimos_digitos` (slice -4). Esto es lo correcto por compliance
  (PCI). Lo que se pierde: la fecha de vencimiento no queda registrada
  — si el TP requiere mostrarla después, hay que agregar la columna o
  guardarla en `alias`.

## 24. `medios_pago.cliente` y ownership

- **Spec:** "mis medios de pago" implícito por el JWT.
- **DB:** `medios_pago.cliente` (FK a clientes, NOT NULL). No hay RLS por
  cliente (RLS está deshabilitado a nivel de policy específico — se trabaja
  desde el backend con service_role).
- **Resolución:** los handlers filtran por `cliente: req.user.sub` en toda
  query y verifican ownership en `findOwn()` antes de devolver detalle o
  borrar.

---

## Pendientes de chequear cuando lleguemos a esos módulos

- [ ] `productos.disponible`, `productos_extension.es_obra_de_arte`,
  `subastas_extension.es_coleccion`, `seguros_extension.*` — ¿qué valores
  aceptan?
- [ ] `solicitudes_venta.estado` — ¿enum?
- [ ] `notificaciones.tipo`, `notificaciones.leida`, `notificaciones.tiene_mensajes`
  — ¿enum / 'si'-'no'?
- [ ] `items_catalogo_estado.estado` — confirmamos que acepta `'en_subasta'`
  y `'pendiente'`, pero no probamos `'vendida'`.
- [ ] `multas.estado` — ¿enum?
- [ ] `registro_subasta_extension.estado_pago` — ¿enum?
- [ ] Sequence sync — si llegamos a tener problemas con duplicate keys porque
  las tablas con SERIAL tienen filas insertadas a mano fuera del seq.
