import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography } from "../../constants";
import { getNotificacion, getMensajes, enviarMensaje } from "../../api/notificaciones";
import { esErrorServidor } from "../../api/client";
import ServerErrorScreen from "../../components/common/ServerErrorScreen";
import ChatBubble from "../../components/common/ChatBubble";

function etiquetaDia(iso) {
  const fecha = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  const mismoDia = (a, b) => a.toDateString() === b.toDateString();
  if (mismoDia(fecha, hoy)) return "Hoy";
  if (mismoDia(fecha, ayer)) return "Ayer";
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

function construirItems(detalle, mensajes) {
  const base = [];
  if (detalle) {
    base.push({
      id: "notif",
      emisor: "sistema",
      contenido: detalle.mensaje,
      fecha: detalle.fecha,
      titulo: detalle.titulo,
    });
  }
  for (const m of mensajes) {
    base.push({ id: m.id, emisor: m.emisor, contenido: m.contenido, fecha: m.fecha });
  }
  base.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const items = [];
  let ultimoDia = null;
  for (const msg of base) {
    const dia = new Date(msg.fecha).toDateString();
    if (dia !== ultimoDia) {
      items.push({ tipo: "sep", id: `sep-${dia}`, etiqueta: etiquetaDia(msg.fecha) });
      ultimoDia = dia;
    }
    items.push({ tipo: "msg", ...msg });
  }
  return items;
}

export default function ChatNotificacionScreen({ navigation, route }) {
  const { id, titulo } = route.params;

  const [detalle, setDetalle] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorServidor, setErrorServidor] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      setLoading(true);
      setErrorServidor(false);
      try {
        const [det, hilo] = await Promise.all([getNotificacion(id), getMensajes(id)]);
        if (!activo) return;
        setDetalle(det);
        setMensajes(hilo.data);
      } catch (error) {
        if (activo && esErrorServidor(error)) setErrorServidor(true);
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [id]);

  const items = useMemo(() => construirItems(detalle, mensajes), [detalle, mensajes]);

  async function enviar() {
    const contenido = texto.trim();
    if (!contenido || enviando) return;
    const temp = {
      id: `tmp-${Date.now()}`,
      emisor: "usuario",
      contenido,
      fecha: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, temp]);
    setTexto("");
    setEnviando(true);
    try {
      const guardado = await enviarMensaje(id, contenido);
      setMensajes((prev) => prev.map((m) => (m.id === temp.id ? guardado : m)));
    } catch (error) {
      setMensajes((prev) => prev.filter((m) => m.id !== temp.id));
      setTexto(contenido);
      Alert.alert("Error", "No se pudo enviar el mensaje");
    } finally {
      setEnviando(false);
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
    return <ServerErrorScreen onRetry={() => navigation.replace("ChatNotificacion", { id, titulo })} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo} numberOfLines={1}>
          {titulo}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.lista}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {items.map((item) =>
            item.tipo === "sep" ? (
              <View key={item.id} style={styles.sepRow}>
                <Text style={styles.sepTexto}>{item.etiqueta}</Text>
              </View>
            ) : (
              <ChatBubble
                key={item.id}
                contenido={item.contenido}
                fecha={item.fecha}
                mine={item.emisor === "usuario"}
                titulo={item.id === "notif" ? item.titulo : undefined}
              />
            )
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escribí un mensaje..."
            placeholderTextColor={colors.textDisabled}
            value={texto}
            onChangeText={setTexto}
            multiline
          />
          <TouchableOpacity
            style={[styles.enviarBtn, (!texto.trim() || enviando) && styles.enviarBtnDisabled]}
            onPress={enviar}
            disabled={!texto.trim() || enviando}
          >
            <Text style={styles.enviarTexto}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
    flex: 1,
  },
  lista: {
    paddingVertical: 12,
  },
  sepRow: {
    alignItems: "center",
    marginVertical: 10,
  },
  sepTexto: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...typography.body,
    color: colors.textPrimary,
  },
  enviarBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  enviarBtnDisabled: {
    backgroundColor: colors.textDisabled,
  },
  enviarTexto: {
    ...typography.button,
    color: colors.surface,
  },
});
