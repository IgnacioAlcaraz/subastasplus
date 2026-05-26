import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography } from '../../constants';
import Input from '../../components/common/Input';

const TIPOS = [
  { value: 'arte', label: 'Obra de arte' },
  { value: 'antiguedad', label: 'Antigüedad' },
  { value: 'joya', label: 'Joya' },
  { value: 'vehiculo', label: 'Vehículo' },
  { value: 'mueble', label: 'Mueble' },
  { value: 'otro', label: 'Otro' },
];

const MAX_FOTOS = 6;

export default function NuevaSolicitudStep1Screen({ navigation }) {
  const [tipo, setTipo] = useState('arte');
  const [nombreBien, setNombreBien] = useState('');
  const [artista, setArtista] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotos, setFotos] = useState([]);
  const [pickingFoto, setPickingFoto] = useState(false);

  async function agregarFoto() {
    if (fotos.length >= MAX_FOTOS) return;
    setPickingFoto(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir fotos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.4,
        base64: true,
        exif: false,
      });
      if (!result.canceled && result.assets?.[0]?.base64) {
        setFotos((prev) => [...prev, result.assets[0].base64]);
      }
    } finally {
      setPickingFoto(false);
    }
  }

  function eliminarFoto(index) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  function siguiente() {
    if (!nombreBien.trim()) {
      Alert.alert('Campo requerido', 'Ingresá el nombre del bien.');
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert('Campo requerido', 'Ingresá la descripción del bien.');
      return;
    }
    if (fotos.length < MAX_FOTOS) {
      Alert.alert('Fotos insuficientes', `Debés subir al menos ${MAX_FOTOS} fotos.`);
      return;
    }
    navigation.navigate('NuevaSolicitudStep2', {
      tipo,
      nombreBien: nombreBien.trim(),
      nombreArtista: artista.trim() || null,
      descripcion: descripcion.trim(),
      imagenes: fotos,
    });
  }

  const fotasFaltantes = MAX_FOTOS - fotos.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.paso}>Paso 1/2</Text>
      </View>

      <Text style={styles.title}>Solicitar subasta</Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.progressActive]} />
        <View style={styles.progressSegment} />
      </View>

      <Text style={styles.sectionLabel}>Tipo de bien</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tiposScroll}>
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, tipo === t.value && styles.chipActive]}
            onPress={() => setTipo(t.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, tipo === t.value && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Input label="Nombre del bien" value={nombreBien} onChangeText={setNombreBien} placeholder="Ej: Jarrón Ming" />
      <Input label="Artista / diseñador" value={artista} onChangeText={setArtista} placeholder="Ej: Antonio Berni" />
      <Input label="Descripción del bien" value={descripcion} onChangeText={setDescripcion} placeholder="Ej: Collage sobre madera, 120×90cm." />

      <View style={styles.fotosHeader}>
        <Text style={styles.sectionLabel}>Fotos del bien</Text>
        <Text style={[styles.fotasCounter, fotasFaltantes > 0 && styles.fotasCounterWarn]}>
          {fotos.length}/{MAX_FOTOS} min
        </Text>
      </View>

      <View style={styles.fotosGrid}>
        {Array.from({ length: MAX_FOTOS }).map((_, i) => {
          const foto = fotos[i];
          if (foto) {
            return (
              <TouchableOpacity key={i} style={styles.fotoSlot} onPress={() => eliminarFoto(i)} activeOpacity={0.8}>
                <Image source={{ uri: `data:image/jpeg;base64,${foto}` }} style={styles.fotoImage} />
                <View style={styles.fotoRemove}>
                  <Text style={styles.fotoRemoveText}>×</Text>
                </View>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity key={i} style={[styles.fotoSlot, styles.fotoSlotEmpty]} onPress={agregarFoto} activeOpacity={0.7} disabled={pickingFoto}>
              {pickingFoto && i === fotos.length ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Text style={styles.fotoPlus}>+</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.btn} onPress={siguiente} activeOpacity={0.85}>
        <Text style={styles.btnText}>Siguiente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const SLOT_SIZE = 100;

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
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginBottom: 8, marginTop: 16 },
  tiposScroll: { marginBottom: 4 },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  chipText: { ...typography.bodySmall, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  fotosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  fotasCounter: { ...typography.bodySmall, color: colors.textSecondary },
  fotasCounterWarn: { color: colors.error, fontWeight: '600' },
  fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  fotoSlot: { width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: 10, overflow: 'hidden' },
  fotoSlotEmpty: {
    borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  fotoImage: { width: '100%', height: '100%' },
  fotoRemove: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  fotoRemoveText: { color: colors.surface, fontSize: 14, lineHeight: 18 },
  fotoPlus: { fontSize: 24, color: colors.textSecondary },
  btn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { ...typography.button, color: colors.surface },
});
