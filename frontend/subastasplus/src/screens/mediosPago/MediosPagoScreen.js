import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';
import { useFocusEffect } from '@react-navigation/native';
import { getMediosPago } from '../../api/mediosPago';
import CardMedioPago from '../../components/common/CardMedioPago';

const OPCIONES_AGREGAR = [
  { id: 'cuenta-nacional', titulo: 'Cuenta Nacional' },
  { id: 'cuenta-exterior', titulo: 'Cuenta Exterior' },
  { id: 'cheque', titulo: 'Cuenta Cheque' },
  { id: 'tarjeta', titulo: 'Cuenta Tarjeta' },
];

export default function MediosPagoScreen({ navigation }) {
  const [medios, setMedios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await getMediosPago();
      setMedios(Array.isArray(data) ? data : data.mediosPago ?? []);
    } catch {
      setMedios([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar().finally(() => setLoading(false));
    }, [cargar])
  );

  async function onRefresh() {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }

  function navegarFormulario(id) {
    setModalVisible(false);
    navigation.navigate(id, { successRoute: 'MediosPago' });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backTexto}>{'<'} Medios de pago</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>{'<'} Medios de pago</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={medios}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={medios.length === 0 ? styles.listaVacia : styles.lista}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <CardMedioPago
            item={item}
            onPress={() => navigation.navigate('DetalleMedioPago', { item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.centrado}>
            <Text style={styles.vacioPrincipal}>Sin medios de pago</Text>
            <Text style={styles.vacioSub}>Tocá + para agregar uno</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabTexto}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitulo}>Elegir Medio de Pago</Text>
            {OPCIONES_AGREGAR.map((op) => (
              <TouchableOpacity
                key={op.id}
                style={styles.sheetOpcion}
                onPress={() => navegarFormulario(op.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.sheetOpcionTexto}>{op.titulo}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerNav: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backTexto: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  lista: {
    padding: 16,
    gap: 10,
  },
  listaVacia: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vacioPrincipal: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  vacioSub: {
    ...typography.body,
    color: colors.textDisabled,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  fabTexto: {
    color: colors.surface,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 12,
  },
  sheetTitulo: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sheetOpcion: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sheetOpcionTexto: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
