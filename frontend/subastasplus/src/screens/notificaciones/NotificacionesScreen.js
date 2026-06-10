import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors, typography } from "../../constants";
import { getNotificaciones } from "../../api/notificaciones";
import { esErrorServidor } from "../../api/client";
import ServerErrorScreen from "../../components/common/ServerErrorScreen";

function tiempoRelativo(iso) {
  const fecha = new Date(iso);
  const min = Math.floor((Date.now() - fecha.getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "Ayer";
  if (dias < 7) return `hace ${dias}d`;
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export default function NotificacionesScreen({ navigation }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorServidor, setErrorServidor] = useState(false);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loadingMore, setLoadingMore] = useState(false);

  const cargar = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    if (pageNum === 1) setErrorServidor(false);
    try {
      const res = await getNotificaciones(pageNum);
      setNotificaciones((prev) => (pageNum === 1 ? res.data : [...prev, ...res.data]));
      setMeta(res.meta);
    } catch (error) {
      if (pageNum === 1 && esErrorServidor(error)) setErrorServidor(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar(1);
    }, [cargar])
  );

  function cargarMas() {
    if (loadingMore || meta.page >= meta.totalPages) return;
    cargar(meta.page + 1);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorServidor) {
    return <ServerErrorScreen onRetry={() => cargar(1)} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Notificaciones</Text>
      </View>

      <FlatList
        data={notificaciones}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.lista}
        onEndReached={cargarMas}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("ChatNotificacion", { id: item.id, titulo: item.titulo })}
          >
            <View style={[styles.dot, item.leida ? styles.dotLeida : styles.dotNoLeida]} />
            <View style={styles.itemTexto}>
              <Text style={[styles.titulo, !item.leida && styles.tituloNoLeida]} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.mensaje} numberOfLines={1}>
                {item.mensaje}
              </Text>
            </View>
            <Text style={styles.tiempo}>{tiempoRelativo(item.fecha)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.vacio}>No tenés notificaciones</Text>}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backTexto: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  headerTitulo: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  lista: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotNoLeida: { backgroundColor: colors.primary },
  dotLeida: { backgroundColor: "transparent" },
  itemTexto: { flex: 1 },
  titulo: {
    ...typography.label,
    color: colors.textPrimary,
  },
  tituloNoLeida: {
    fontWeight: "700",
  },
  mensaje: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tiempo: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  vacio: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 60,
  },
  footer: {
    marginVertical: 16,
  },
});
