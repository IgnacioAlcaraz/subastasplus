import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { colors, typography } from '../../constants';
import Input from '../../components/common/Input';
import { crearSolicitud } from '../../api/solicitudesVenta';

export default function NuevaSolicitudStep2Screen({ navigation, route }) {
  const step1 = route.params;

  const [historia, setHistoria] = useState('');
  const [dueniosAnteriores, setDueniosAnteriores] = useState('');
  const [curiosidades, setCuriosidades] = useState('');
  const [declaracion, setDeclaracion] = useState(false);
  const [loading, setLoading] = useState(false);

  async function enviar() {
    if (!declaracion) {
      Alert.alert('Declaración requerida', 'Debés declarar que el bien te pertenece y no tiene impedimentos legales.');
      return;
    }
    setLoading(true);
    try {
      await crearSolicitud({
        ...step1,
        historia: historia.trim() || null,
        dueniosAnteriores: dueniosAnteriores.trim() || null,
        curiosidades: curiosidades.trim() || null,
        declaracionPropiedad: true,
      });
      navigation.replace('ConfirmacionSolicitud');
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.paso}>Paso 2/2</Text>
      </View>

      <Text style={styles.title}>Solicitar subasta</Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.progressActive]} />
        <View style={[styles.progressSegment, styles.progressActive]} />
      </View>

      <Input label="Historia / contexto" value={historia} onChangeText={setHistoria} placeholder="Col. privada desde..." />
      <Input label="Dueños anteriores" value={dueniosAnteriores} onChangeText={setDueniosAnteriores} placeholder="Familia García" />
      <Input label="Curiosidades" value={curiosidades} onChangeText={setCuriosidades} placeholder="Exhibida en París" />

      <TouchableOpacity style={styles.checkRow} onPress={() => setDeclaracion((v) => !v)} activeOpacity={0.7}>
        <View style={[styles.checkbox, declaracion && styles.checkboxActive]}>
          {declaracion && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkLabel}>Declaro propiedad y sin impedimento legal</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={enviar} activeOpacity={0.85} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.btnText}>Enviar solicitud</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 36, marginBottom: 8 },
  back: { fontSize: 28, color: colors.textPrimary, lineHeight: 32 },
  paso: { ...typography.bodySmall, color: colors.textSecondary },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 12 },
  progressBar: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressActive: { backgroundColor: colors.primary },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 32 },
  checkbox: {
    width: 22, height: 22, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  checkLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  btn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...typography.button, color: colors.surface },
});
