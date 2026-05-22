import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { getPerfil, subirFotoPerfil } from '../../api/perfil';
import client from '../../api/client';
import Button from '../../components/common/Button';
import ProfileMenuItem from '../../components/common/ProfileMenuItem';

const MENU_ITEMS = [
  { label: 'Medios de pago', screen: 'MediosPago' },
  { label: 'Historial compras', screen: 'HistorialCompras' },
  { label: 'Historial ventas', screen: 'HistorialVentas' },
  { label: 'Métricas', screen: 'Metricas' },
  { label: 'Multa a pagar', screen: 'Multas' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [fotoUri, setFotoUri] = useState(null);
  const [fotoError, setFotoError] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function cargarFoto() {
    try {
      const response = await client.get('/perfil/foto', { responseType: 'arraybuffer' });
      const bytes = new Uint8Array(response.data);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      setFotoUri(`data:image/jpeg;base64,${btoa(binary)}`);
      setFotoError(false);
    } catch {
      setFotoError(true);
    }
  }

  useEffect(() => {
    getPerfil()
      .then((data) => {
        setPerfil(data);
        if (data.fotoPerfil) {
          setHasPhoto(true);
          cargarFoto();
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function seleccionarFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para cambiar la foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      await subirFotoPerfil(result.assets[0].base64);
      setHasPhoto(true);
      await cargarFoto();
    } catch {
      Alert.alert('Error', 'No se pudo subir la foto. Intentá de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const data = perfil || user || {};
  const nombre = data.nombre || '';
  const apellido = data.apellido || '';
  const categoria = data.categoria || '';
  const initials = [nombre[0], apellido[0]].filter(Boolean).join('').toUpperCase() || '?';
  const displayName = [nombre, apellido].filter(Boolean).join(' ') || 'Usuario';
  const categoriaMayus = categoria
    ? categoria.charAt(0).toUpperCase() + categoria.slice(1)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={seleccionarFoto} disabled={uploading} activeOpacity={0.8}>
          <View style={styles.avatarWrapper}>
            {hasPhoto && fotoUri && !fotoError ? (
              <Image
                source={{ uri: fotoUri }}
                style={styles.avatar}
                onError={() => setFotoError(true)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={colors.surface} />
              </View>
            )}
            <View style={styles.editBadge} />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{displayName}</Text>
        {categoriaMayus ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{categoriaMayus}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.label}>
              <ProfileMenuItem
                label={item.label}
                onPress={() => navigation?.navigate(item.screen)}
              />
              {index < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.logoutContainer}>
          <Button title="Cerrar sesión" variant="outline" onPress={logout} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    backgroundColor: colors.textDisabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  avatarText: {
    ...typography.h2,
    color: colors.surface,
  },
  name: {
    ...typography.h2,
    color: colors.surface,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  badgeText: {
    ...typography.label,
    color: colors.surface,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 20,
  },
  logoutContainer: {
    marginTop: 24,
  },
});