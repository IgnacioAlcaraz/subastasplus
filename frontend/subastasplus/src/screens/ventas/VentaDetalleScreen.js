import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, FlatList, Image, Dimensions, Alert,
} from 'react-native';
import { colors, typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { getSolicitudById, aceptarCondiciones } from '../../api/solicitudesVenta';
import { SERVER_URL, esErrorServidor } from '../../api/client';
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

function Carrusel({ imagenes, token }) {
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
        renderItem={({ item }) => (
          <Image
            source={{ uri: `${SERVER_URL}${item}`, headers: { Authorization: `Bearer ${token}` } }}
            style={{ width: ancho, height: 260 }}
            resizeMode="cover"
          />
        )}
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

function ContenidoEnSubasta({ solicitud, navigation }) {
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

      {solicitud.polizaSeguro ? (
        <View style={[styles.btns, { marginTop: 8 }]}>
          <Button
            title="Ver póliza de seguro"
            onPress={() => navigation.navigate('PolizaSeguro', {
              solicitudId: solicitud.id,
              poliza: solicitud.polizaSeguro,
            })}
          />
        </View>
      ) : (
        <Text style={styles.meta}>Sin póliza asignada aún.</Text>
      )}
    </View>
  );
}

function ContenidoEsperandoEntrega({ solicitud }) {
  const sym = monedaSimbolo(solicitud.moneda);
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>Esperando entrega</Text>
      <Text style={styles.esperando}>
        Aceptaste las condiciones. Enviá el bien a la dirección indicada.
      </Text>

      {solicitud.ubicacionDeposito ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitulo}>Dirección de entrega</Text>
          <Text style={styles.meta}>{solicitud.ubicacionDeposito}</Text>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitulo}>Condiciones acordadas</Text>
        <Text style={styles.meta}>Valor base: {sym} {fmt(solicitud.valorBase)}</Text>
        <Text style={styles.meta}>Comisión: {solicitud.comisiones}%</Text>
        <Text style={styles.meta}>Neto estimado: {sym} {fmt(solicitud.valorBase * (1 - solicitud.comisiones / 100))}</Text>
      </View>

      <Text style={styles.meta}>
        Una vez que el bien llegue al depósito, será inspeccionado. Si no coincide con lo declarado podrá ser rechazado y el envío de devolución tendrá cargo.
      </Text>
    </View>
  );
}

function ContenidoRevisionFisica({ solicitud }) {
  const neto = solicitud.valorBase * (1 - solicitud.comisiones / 100);
  const sym = monedaSimbolo(solicitud.moneda);
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>En revisión física</Text>
      <Text style={styles.esperando}>
        Tu bien llegó a nuestro depósito y está siendo inspeccionado.
      </Text>

      {solicitud.ubicacionDeposito ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitulo}>Depósito</Text>
          <Text style={styles.meta}>{solicitud.ubicacionDeposito}</Text>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitulo}>Condiciones acordadas</Text>
        <Text style={styles.meta}>Valor base: {sym} {fmt(solicitud.valorBase)}</Text>
        <Text style={styles.meta}>Comisión: {solicitud.comisiones}%</Text>
        <Text style={styles.meta}>Neto estimado: {sym} {fmt(neto)}</Text>
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
  const { token } = useAuth();
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorServidor, setErrorServidor] = useState(false);
  const [rechazando, setRechazando] = useState(false);

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
      case 'rechazada_admin':
      case 'rechazada_cliente':
      case 'rechazada_deposito':
        return <ContenidoRechazada solicitud={solicitud} />;
      case 'en_subasta':
        return <ContenidoEnSubasta solicitud={solicitud} navigation={navigation} />;
      case 'vendida':
        return <ContenidoVendida solicitud={solicitud} />;
      case 'no_vendida':
        return <ContenidoNoVendida solicitud={solicitud} />;
      default:
        return <ContenidoPendiente solicitud={solicitud} />;
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.back}>‹ Solicitud</Text>
      </TouchableOpacity>

      <Carrusel imagenes={solicitud.imagenes} token={token} />

      {renderContenido()}
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
});
