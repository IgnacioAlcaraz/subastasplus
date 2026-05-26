import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, FlatList, Image, Dimensions, Alert,
} from 'react-native';
import { colors, typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { getSolicitudById } from '../../api/solicitudesVenta';
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

  return (
    <View style={styles.body}>
      <Text style={styles.valorLabel}>Valor base propuesto</Text>
      <Text style={styles.valorPrecio}>US$ {fmt(solicitud.valorBase)}</Text>
      <Text style={styles.meta}>Comisión: {solicitud.comisiones}% - Neto: US$ {fmt(neto)}</Text>
      <Text style={styles.meta}>Costo de envío: US$ {fmt(solicitud.costoEnvio)}</Text>

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
            : <Text style={styles.btnRechazarText}>Rechazar (devolución)</Text>}
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

  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>{solicitud.nombreBien || solicitud.descripcion} vendido!</Text>
      <Text style={styles.meta}>Venta: US$ {fmt(precio)}</Text>
      <Text style={styles.meta}>Comisión: -US$ {fmt(comision)}</Text>
      <Text style={styles.valorPrecio}>Neto: US$ {fmt(neto)}</Text>
      {cbu ? <Text style={styles.meta}>Cuenta: CBU {maskCbu(cbu)}</Text> : null}
    </View>
  );
}

function ContenidoNoVendida({ solicitud }) {
  const precio = solicitud.valorBase;
  const comision = precio * (solicitud.comisiones / 100);
  const neto = precio - comision;

  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>Nadie pujo</Text>
      <Text style={styles.meta}>Empresa compró al base: US$ {fmt(precio)}</Text>
      <Text style={styles.meta}>
        Comisión: -US$ {fmt(comision)} | Neto: US$ {fmt(neto)}
      </Text>
    </View>
  );
}

function ContenidoEnSubasta({ solicitud, navigation }) {
  return (
    <View style={styles.body}>
      <Text style={styles.nombre}>{solicitud.nombreBien || solicitud.descripcion}</Text>

      {solicitud.subastaAsignada ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitulo}>Subasta asignada</Text>
          <Text style={styles.meta}>#{solicitud.subastaAsignada}</Text>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitulo}>Valor base</Text>
        <Text style={styles.valorPrecio}>US$ {fmt(solicitud.valorBase)}</Text>
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

function ContenidoRechazada({ solicitud }) {
  const rechazadoPorAdmin = solicitud.valorBase == null;

  return (
    <View style={styles.body}>
      {rechazadoPorAdmin && solicitud.motivoRechazo ? (
        <>
          <Text style={styles.nombre}>Causas del rechazo</Text>
          <Text style={styles.esperando}>{solicitud.motivoRechazo}</Text>
          <Text style={styles.meta}>Bien devuelto con cargo.</Text>
        </>
      ) : null}

      {solicitud.costoEnvio != null ? (
        <View style={[styles.devolucionCard, rechazadoPorAdmin && { marginTop: 24 }]}>
          <Text style={styles.nombre}>Devolución en proceso</Text>
          <Text style={styles.meta}>Costo: US$ {fmt(solicitud.costoEnvio)}</Text>
          {solicitud.direccionEnvio ? (
            <Text style={styles.meta}>Dir: {solicitud.direccionEnvio}</Text>
          ) : null}
          <Text style={styles.metaBold}>Estado: En tránsito</Text>
        </View>
      ) : null}

      {!rechazadoPorAdmin && (
        <Text style={styles.esperando}>Bien devuelto con cargo.</Text>
      )}
    </View>
  );
}

export default function VentaDetalleScreen({ navigation, route }) {
  const { id } = route.params;
  const { token } = useAuth();
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorServidor, setErrorServidor] = useState(false);

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
  const [rechazando, setRechazando] = useState(false);

  const cargar = useCallback(() => {
    return getSolicitudById(id)
      .then(setSolicitud)
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  function confirmarRechazo() {
    Alert.alert(
      'Rechazar condiciones',
      'Si rechazás, el bien será devuelto con cargo. ¿Confirmás?',
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
      case 'aceptada':
        return <ContenidoAceptada solicitud={solicitud} navigation={navigation} onRechazar={confirmarRechazo} rechazando={rechazando} />;
      case 'rechazada':
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
