# Diseño — Pago de Multas

**Fecha:** 2026-05-27  
**Contexto:** Flujo de pago de multas por incumplimiento accesible desde el Perfil del usuario.

---

## Alcance

Un usuario con multa activa (estado `pendiente`) puede verla y pagarla con un medio de pago verificado. Si no tiene multa activa, ve un estado vacío. Tras el pago, ve una confirmación.

No se construye historial de compras en esta tarea.

---

## Pantallas

### MultasScreen (`src/screens/profile/MultasScreen.js`)

**Estado vacío** (sin multa pendiente):
- Header con botón "< Volver"
- Mensaje centrado: "No tenés multa activa" + subtítulo "Podés participar en subastas"

**Estado con multa activa** (estado === `pendiente`):
- Header "< Multas"
- Card con:
  - Título: "Multa por incumplimiento"
  - Monto: `US$ X.XXX` o `$X.XXX` según `moneda`
  - Porcentaje: calculado como `Math.round(montoMulta / montoOriginal * 100)% del valor ofertado`
  - Pieza y subasta: `Pieza #piezaId - Subasta #subastaId` (enriquecido desde backend)
  - Generada: fecha formateada de `fechaCreacion`
  - Plazo: countdown en horas/minutos hasta `fechaLimite`
- Sección "Seleccioná medio de pago":
  - Lista de medios de pago del usuario (solo `verificado === 'si'`)
  - El primero queda seleccionado por defecto
  - Toque cambia la selección (radio-style con borde `colors.primary`)
  - Si no hay medios verificados: mensaje "No tenés medios de pago verificados"
- Botón `<Button title="Pagar multa" />` deshabilitado si no hay medio seleccionado
- Al confirmar: `POST /multas/:id/pagar` con `{ medioPagoId }` → navega a `MultaPagada`

**Carga:** spinner mientras se resuelven `getMultas()` + `getMediosPago()` en paralelo  
**Error 5xx:** `<ServerErrorScreen onRetry={...} />`  
**Error `MULTA_PAGO_FALLIDO`:** Alert "No se pudo procesar el pago. Probá con otro medio de pago."  
**Error `MULTA_PLAZO_VENCIDO`:** Alert "El plazo venció. Tu caso fue derivado a la justicia." y recarga la pantalla.

---

### MultaPagadaScreen (`src/screens/profile/MultaPagadaScreen.js`)

- Pantalla estática centrada, sin header propio
- Ícono: círculo con "OK" en `colors.primary`
- Título: "Multa pagada" (`typography.h2`)
- Texto: "Aún debés presentar fondos para la compra original dentro del plazo de 72hs" (`typography.body`, `colors.textSecondary`)
- Botón `<Button title="Historial de Compras" />` → `navigation.navigate('ProfileHome')`

---

## Backend

### `multas.controller.js` — `listar`

Enriquecer `multaShape` para incluir `piezaId` y `subastaId` vía JOIN:

```
multas
  → registro_de_subasta (via multas.registro)
    → piezas (via registro_de_subasta.pieza)
    → subastas (via registro_de_subasta.subasta)
```

Shape resultante agrega:
```js
{
  piezaId: String | null,
  subastaId: String | null,
}
```

Solo se modifica `listar`. `pagar` no cambia.

---

## API Frontend

**`src/api/multas.js`** (archivo nuevo):

```js
getMultas()        // GET /multas
pagarMulta(id, medioPagoId)  // POST /multas/:id/pagar { medioPagoId }
```

---

## Navegación

**`ProfileNavigator.js`** — agregar 2 pantallas al Stack:

```
Multas        → MultasScreen
MultaPagada   → MultaPagadaScreen
```

ProfileScreen ya tiene `navigate('Multas')` en el ítem "Multa a pagar".

---

## Restricciones

- Colores solo desde `colors.js`, tipografía desde `typography.js`
- No se usan componentes nuevos; solo `Button` existente + primitivas RN
- No se agregan librerías
- Sin comentarios en el código
