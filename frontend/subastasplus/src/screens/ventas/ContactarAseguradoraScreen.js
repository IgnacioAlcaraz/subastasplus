import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, typography } from '../../constants';
import { contactarAseguradora } from '../../api/solicitudesVenta';

export default function ContactarAseguradoraScreen({ navigation, route }) {
  const { solicitudId } = route.params;
  const [contacto, setContacto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contactarAseguradora(solicitudId)
      .then(setContacto)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [solicitudId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!contacto) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>No se pudo cargar el contacto.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.back}>‹ Aseguradora</Text>
      </TouchableOpacity>

      <Text style={styles.nombre}>{contacto.nombre ?? '—'}</Text>

      {contacto.telefono ? <Text style={styles.dato}>{contacto.telefono}</Text> : null}
      {contacto.email ? <Text style={styles.dato}>{contacto.email}</Text> : null}
      {contacto.web ? <Text style={styles.dato}>{contacto.web}</Text> : null}

      {contacto.numeroPoliza ? (
        <Text style={styles.poliza}>Póliza: #{contacto.numeroPoliza}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  backBtn: { paddingTop: 52, paddingBottom: 16 },
  back: { ...typography.body, color: colors.textPrimary },
  nombre: { ...typography.h2, color: colors.textPrimary, marginBottom: 16 },
  dato: { ...typography.body, color: colors.textSecondary, marginBottom: 8 },
  error: { ...typography.body, color: colors.textSecondary },
  poliza: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 24 },
});
