import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, FlatList, Image, Dimensions, Alert,
} from 'react-native';
import { colors, typography } from '../../constants';
import { getSolicitudById, aceptarCondiciones, cancelarSolicitud } from '../../api/solicitudesVenta';
import client, { esErrorServidor } from '../../api/client';
import Button from '../../components/common/Button';
import ServerErrorScreen from '../../components/common/ServerErrorScreen';

const TIPO_LABEL = {
  arte: 'Obra de arte',
  antiguedad: 'Antigüedad',
  joya: 'Joya',
  vehiculo: 'Vehículo',
  mueble: 'Mueble',
  otro: 'Otro',
};

function formatFecha(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmt(n) {
  return n?.toLocaleString('es-AR', { minimumFractionDigits: 0 }) ?? '—';
}

function monedaSimbolo(moneda) {
  return moneda === 'ARS' ? '$' : 'US$';
}

function CarruselImagen({ path }) {
  const [uri, setUri] = useState(null);
  const ancho = Dimensions.get('window').width;

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      try {
        const cleanPath = path.replace(/^\/v1/, '');
        const response = await client.get(cleanPath, { responseType: 'arraybuffer' });
        const bytes = new Uint8Array(response.data);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        if (!cancelled) setUri(`data:image/jpeg;base64,${btoa(binary)}`);
      } catch {}
    }
    cargar();
    return () => { cancelled = true; };
  }, [path]);

  return uri ? (
    <Image source={{ uri }} style={{ width: ancho, height: 260 }} resizeMode="cover" />
  ) : (
    <View style={[styles.placeholder, { width: ancho, height: 260 }]} />
  );
}

function Carrusel({ imagenes }) {
  const [activa, setActiva] = useState(0);
  const ancho = Dimensions.get('window').width;

  if (!imagenes?.length) {
    return <View style={[styles.placeholder, { width: ancho, height: 260 }]} />;
  }

  return (
    <View>
      <FlatList
        data={imagenes}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / ancho);
          setActiva(index);
        }}
        renderItem={({ item }) => <CarruselImagen path={item} />}
      />
      <View style={styles.dots}>
        {imagenes.map((_, i) => (
          <View key={i} style={[styles.dot, i === activa && styles.dotActivo]} />
        ))}
      </View>
    </View>
  );
}

function ContenidoPendiente({ solicitud }) {
  const tipo = TIPO_LABEL[solicitud.tipo] ?? solicitud.tipo;
  const cantFotos = solicitud.imagenes?.length ?? 0;
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>{solicitud.nombreBien || solicitud.descripcion}</Text>
      <Text style={styles.meta}>{cantFotos} fotos · {tipo}</Text>
      <Text style={styles.fecha}>Enviada: {formatFecha(solicitud.fechaCreacion)}</Text>
      <Text style={styles.esperando}>Esperando evaluación...</Text>
    </View>
  );
}

function ContenidoAceptada({ solicitud, navigation, onRechazar, rechazando }) {
  const neto = solicitud.valorBase * (1 - solicitud.comisiones / 100);
  const sym = monedaSimbolo(solicitud.moneda);

  return (
    <View style={styles.body}>
      <Text style={styles.valorLabel}>Valor base propuesto</Text>
      <Text style={styles.valorPrecio}>{sym} {fmt(solicitud.valorBase)}</Text>
      <Text style={styles.meta}>Comisión: {solicitud.comisiones}% - Neto: {sym} {fmt(neto)}</Text>
      <Text style={styles.meta}>Costo de envío: {sym} {fmt(solicitud.costoEnvio)}</Text>

      <View style={styles.btns}>
        <Button
          title="Aceptar condiciones"
          onPress={() => navigation.navigate('AceptarCondiciones', { solicitud })}
        />
        <TouchableOpacity
          style={styles.btnRechazar}
          onPress={onRechazar}
          disabled={rechazando}
          activeOpacity={0.8}
        >
          {rechazando
            ? <ActivityIndicator color={colors.textSecondary} />
            : <Text style={styles.btnRechazarText}>Rechazar propuesta</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function maskCbu(cbu) {
  if (!cbu) return null;
  return `***${String(cbu).slice(-4)}`;
}

function ContenidoVendida({ solicitud }) {
  const precio = solicitud.precioVenta ?? solicitud.valorBase;
  const comision = precio * (solicitud.comisiones / 100);
  const neto = precio - comision;
  const cbu = solicitud.cuentaCobro?.cbu;
  const sym = monedaSimbolo(solicitud.moneda);

  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>{solicitud.nombreBien || solicitud.descripcion} vendido!</Text>
      <Text style={styles.meta}>Venta: {sym} {fmt(precio)}</Text>
      <Text style={styles.meta}>Comisión: -{sym} {fmt(comision)}</Text>
      <Text style={styles.valorPrecio}>Neto: {sym} {fmt(neto)}</Text>
      {cbu ? <Text style={styles.meta}>Cuenta: CBU {maskCbu(cbu)}</Text> : null}
    </View>
  );
}

function ContenidoNoVendida({ solicitud }) {
  const precio = solicitud.valorBase;
  const comision = precio * (solicitud.comisiones / 100);
  const neto = precio - comision;
  const sym = monedaSimbolo(solicitud.moneda);

  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>Nadie pujo</Text>
      <Text style={styles.meta}>Empresa compró al base: {sym} {fmt(precio)}</Text>
      <Text style={styles.meta}>
        Comisión: -{sym} {fmt(comision)} | Neto: {sym} {fmt(neto)}
      </Text>
    </View>
  );
}

function ContenidoEnSubasta({ solicitud, navigation, onCancelar, cancelando }) {
  const sym = monedaSimbolo(solicitud.moneda);
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>{solicitud.nombreBien || solicitud.descripcion}</Text>

      {solicitud.subastaAsignada ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitulo}>Subasta asignada</Text>
          <Text style={styles.meta}>#{solicitud.subastaAsignada.id} — {solicitud.subastaAsignada.titulo}</Text>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitulo}>Valor base</Text>
        <Text style={styles.valorPrecio}>{sym} {fmt(solicitud.valorBase)}</Text>
        <Text style={styles.meta}>Comisión: {solicitud.comisiones}%</Text>
      </View>

      {solicitud.ubicacionDeposito ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitulo}>Depósito</Text>
          <Text style={styles.meta}>{solicitud.ubicacionDeposito}</Text>
        </View>
      ) : null}

      <View style={[styles.btns, { marginTop: 8 }]}>
        <TouchableOpacity
          style={styles.btnRechazar}
          onPress={onCancelar}
          disabled={cancelando}
          activeOpacity={0.8}
        >
          {cancelando
            ? <ActivityIndicator color={colors.textSecondary} />
            : <Text style={styles.btnRechazarText}>Cancelar venta</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ContenidoEsperandoEntrega({ solicitud }) {
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>Coordiná la entrega</Text>
      <Text style={styles.esperando}>
        Aceptamos tu bien para revisarlo. Llevalo al lugar indicado dentro del plazo.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitulo}>Dónde llevarlo</Text>
        <Text style={styles.meta}>{solicitud.ubicacionDeposito || 'Pendiente'}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitulo}>Hasta cuándo</Text>
        <Text style={styles.meta}>{solicitud.fechaLimiteEntrega || 'Pendiente'}</Text>
      </View>

      <Text style={styles.meta}>
        Cuando recibamos el bien lo inspeccionaremos y te enviaremos una propuesta de precio.
      </Text>
    </View>
  );
}

function ContenidoRevisionFisica({ solicitud }) {
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>En revisión física</Text>
      <Text style={styles.esperando}>
        Tu bien llegó a nuestro depósito y está siendo inspeccionado. Pronto recibirás una propuesta de precio.
      </Text>

      {solicitud.ubicacionDeposito ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitulo}>Depósito</Text>
          <Text style={styles.meta}>{solicitud.ubicacionDeposito}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ContenidoPendienteAsignacion({ solicitud }) {
  const sym = monedaSimbolo(solicitud.moneda);
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>Pendiente asignación a subasta</Text>
      <Text style={styles.esperando}>
        Aceptaste la propuesta. Tu bien está pendiente de asignación a una subasta. Te avisaremos cuando se asigne.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitulo}>Condiciones acordadas</Text>
        <Text style={styles.meta}>Valor base: {sym} {fmt(solicitud.valorBase)}</Text>
        <Text style={styles.meta}>Comisión: {solicitud.comisiones}%</Text>
      </View>
    </View>
  );
}

function ContenidoCancelado({ solicitud }) {
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>Venta cancelada</Text>
      <Text style={styles.esperando}>
        Cancelaste la venta. Podés retirar tu bien donde lo dejaste.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitulo}>Retiralo en</Text>
        <Text style={styles.meta}>{solicitud.ubicacionDeposito || 'El depósito donde lo dejaste'}</Text>
      </View>
    </View>
  );
}

function ContenidoRechazada({ solicitud }) {
  if (solicitud.estado === 'rechazada_cliente') {
    return (
      <View style={styles.body}>
        <Text style={styles.nombre}>Rechazaste la propuesta</Text>
        <Text style={styles.esperando}>No se aplicaron cargos.</Text>
      </View>
    );
  }

  if (solicitud.estado === 'rechazada_deposito') {
    return (
      <View style={styles.body}>
        <Text style={styles.nombre}>Bien rechazado en depósito</Text>
        {solicitud.motivoRechazo ? (
          <Text style={styles.esperando}>{solicitud.motivoRechazo}</Text>
        ) : null}
        {solicitud.costoEnvio != null ? (
          <View style={[styles.devolucionCard, { marginTop: 16 }]}>
            <Text style={styles.metaBold}>Devolución en proceso</Text>
            <Text style={styles.meta}>Costo: US$ {fmt(solicitud.costoEnvio)}</Text>
            {solicitud.direccionEnvio ? (
              <Text style={styles.meta}>Dir: {solicitud.direccionEnvio}</Text>
            ) : null}
            <Text style={styles.metaBold}>Estado: En tránsito</Text>
          </View>
        ) : null}
      </View>
    );
  }

  // rechazada_admin
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>Solicitud rechazada</Text>
      {solicitud.motivoRechazo ? (
        <Text style={styles.esperando}>{solicitud.motivoRechazo}</Text>
      ) : null}
      <Text style={styles.meta}>No se aplicaron cargos.</Text>
    </View>
  );
}

export default function VentaDetalleScreen({ navigation, route }) {
  const { id } = route.params;
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorServidor, setErrorServidor] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorServidor(false);
    try {
      const datos = await getSolicitudById(id);
      setSolicitud(datos);
    } catch (error) {
      if (esErrorServidor(error)) setErrorServidor(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => { cargar(); }, [cargar])
  );

  function confirmarRechazo() {
    Alert.alert(
      'Rechazar propuesta',
      'Rechazarás la propuesta del tasador. No se aplicarán cargos. ¿Confirmás?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Rechazar', style: 'destructive', onPress: rechazar },
      ]
    );
  }

  async function rechazar() {
    setRechazando(true);
    try {
      await aceptarCondiciones(id, {
        aceptaValorBase: false,
        aceptaComisiones: false,
        cuentaCobro: { tipo: 'nacional', cbu: '0' },
      });
      await cargar();
    } catch {
      await cargar();
    } finally {
      setRechazando(false);
    }
  }

  function confirmarCancelar() {
    Alert.alert(
      'Cancelar venta',
      'Si cancelás, tu bien saldrá de la subasta y deberás retirarlo donde lo dejaste. ¿Confirmás?',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cancelar venta', style: 'destructive', onPress: cancelar },
      ]
    );
  }

  async function cancelar() {
    setCancelando(true);
    try {
      await cancelarSolicitud(id);
      await cargar();
    } catch {
      await cargar();
    } finally {
      setCancelando(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorServidor) {
    return <ServerErrorScreen onRetry={cargar} />;
  }

  if (!solicitud) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar la solicitud.</Text>
      </View>
    );
  }

  function renderContenido() {
    switch (solicitud.estado) {
      case 'en_revision_virtual':
        return <ContenidoPendiente solicitud={solicitud} />;
      case 'propuesta_pendiente':
        return <ContenidoAceptada solicitud={solicitud} navigation={navigation} onRechazar={confirmarRechazo} rechazando={rechazando} />;
      case 'esperando_entrega':
        return <ContenidoEsperandoEntrega solicitud={solicitud} />;
      case 'en_revision_fisica':
        return <ContenidoRevisionFisica solicitud={solicitud} />;
      case 'pendiente_asignacion':
        return <ContenidoPendienteAsignacion solicitud={solicitud} />;
      case 'rechazada_admin':
      case 'rechazada_cliente':
      case 'rechazada_deposito':
        return <ContenidoRechazada solicitud={solicitud} />;
      case 'cancelado':
        return <ContenidoCancelado solicitud={solicitud} />;
      case 'en_subasta':
        return <ContenidoEnSubasta solicitud={solicitud} navigation={navigation} onCancelar={confirmarCancelar} cancelando={cancelando} />;
      case 'vendida':
        return <ContenidoVendida solicitud={solicitud} />;
      case 'no_vendida':
        return <ContenidoNoVendida solicitud={solicitud} />;
      default:
        return <ContenidoPendiente solicitud={solicitud} />;
    }
  }

  const tienePoliza = !!solicitud.polizaSeguro;
  const estadosMuestraPoliza = [
    'en_revision_fisica',
    'pendiente_asignacion',
    'en_subasta',
    'vendida',
    'no_vendida',
  ];
  const mostrarPoliza = tienePoliza && estadosMuestraPoliza.includes(solicitud.estado);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.back}>‹ Solicitud</Text>
      </TouchableOpacity>

      <Carrusel imagenes={solicitud.imagenes} />

      {renderContenido()}

      {mostrarPoliza && (
        <View style={styles.polizaSection}>
          <Button
            title="Ver póliza de seguro"
            onPress={() => navigation.navigate('PolizaSeguro', {
              solicitudId: solicitud.id,
              poliza: solicitud.polizaSeguro,
            })}
          />
          <TouchableOpacity
            style={styles.btnContactar}
            onPress={() => navigation.navigate('ContactarAseguradora', { solicitudId: solicitud.id })}
            activeOpacity={0.8}
          >
            <Text style={styles.btnContactarText}>Contactar aseguradora</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  backBtn: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  back: { ...typography.body, color: colors.textPrimary },
  placeholder: { backgroundColor: colors.border },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActivo: { backgroundColor: colors.textPrimary },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 8 },
  nombre: { ...typography.h2, color: colors.textPrimary },
  meta: { ...typography.bodySmall, color: colors.textSecondary },
  metaBold: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '700' },
  fecha: { ...typography.bodySmall, color: colors.textSecondary },
  esperando: { ...typography.body, color: colors.textSecondary, marginTop: 8 },
  errorText: { ...typography.body, color: colors.textSecondary },
  valorLabel: { ...typography.label, color: colors.textSecondary },
  valorPrecio: { ...typography.h1, color: colors.primary },
  btns: { marginTop: 24, gap: 12 },
  btnRechazar: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  btnRechazarText: { ...typography.button, color: colors.textSecondary },
  devolucionCard: { gap: 8 },
  infoCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, gap: 4 },
  infoCardTitulo: { ...typography.label, color: colors.textSecondary },
  polizaSection: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  btnContactar: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  btnContactarText: { ...typography.button, color: colors.textSecondary },
});
