import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, FlatList, Image, Dimensions,
} from 'react-native';
import { colors, typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { getSolicitudById } from '../../api/solicitudesVenta';
import { SERVER_URL } from '../../api/client';

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

export default function VentaDetalleScreen({ navigation, route }) {
  const { id } = route.params;
  const { token } = useAuth();
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSolicitudById(id)
      .then(setSolicitud)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!solicitud) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar la solicitud.</Text>
      </View>
    );
  }

  const tipo = TIPO_LABEL[solicitud.tipo] ?? solicitud.tipo;
  const cantFotos = solicitud.imagenes?.length ?? 0;
  const fecha = formatFecha(solicitud.fechaCreacion);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.back}>‹ Solicitud</Text>
      </TouchableOpacity>

      <Carrusel imagenes={solicitud.imagenes} token={token} />

      <View style={styles.body}>
        <Text style={styles.nombre}>{solicitud.nombreBien || solicitud.descripcion}</Text>
        <Text style={styles.meta}>{cantFotos} fotos · {tipo}</Text>
        <Text style={styles.fecha}>Enviada: {fecha}</Text>
        <Text style={styles.esperando}>Esperando evaluación...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 48 },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  backBtn: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  back: { ...typography.body, color: colors.textPrimary },
  placeholder: { backgroundColor: colors.border },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActivo: { backgroundColor: colors.textPrimary },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 8 },
  nombre: { ...typography.h2, color: colors.textPrimary },
  meta: { ...typography.bodySmall, color: colors.textSecondary },
  fecha: { ...typography.bodySmall, color: colors.textSecondary },
  esperando: { ...typography.body, color: colors.textSecondary, marginTop: 16 },
  errorText: { ...typography.body, color: colors.textSecondary },
});
