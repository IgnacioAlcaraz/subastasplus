import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography } from "../../constants";

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBubble({ contenido, fecha, mine, titulo }) {
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        {titulo ? (
          <Text style={[styles.titulo, mine ? styles.textMine : styles.textOther]}>{titulo}</Text>
        ) : null}
        <Text style={[styles.texto, mine ? styles.textMine : styles.textOther]}>{contenido}</Text>
        <Text style={[styles.hora, mine ? styles.horaMine : styles.horaOther]}>{formatHora(fecha)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  rowMine: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  titulo: {
    ...typography.label,
    fontWeight: "700",
    marginBottom: 2,
  },
  texto: {
    ...typography.body,
  },
  textMine: { color: colors.surface },
  textOther: { color: colors.textPrimary },
  hora: {
    ...typography.caption,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  horaMine: { color: colors.secondary },
  horaOther: { color: colors.textSecondary },
});
