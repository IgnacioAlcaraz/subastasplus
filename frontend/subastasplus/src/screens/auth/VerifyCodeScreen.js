import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/common/Button";
import { colors, typography } from "../../constants";
import { verificarCodigo, recuperarClave } from "../../api/auth";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 150;

export default function VerifyCodeScreen({ navigation, route }) {
  const { email } = route.params;
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputs = useRef([]);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function handleChange(text, index) {
    const digit = text.slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1].focus();
    }
  }

  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  }

  async function handleVerificar() {
    const codigoCompleto = code.join("");
    if (codigoCompleto.length < CODE_LENGTH) {
      Alert.alert("Código incompleto", "Ingresá los 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const { resetToken } = await verificarCodigo(email, codigoCompleto);
      navigation.navigate("ResetPassword", { email, resetToken });
    } catch (error) {
      Alert.alert("Código inválido", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReenviar() {
    try {
      await recuperarClave(email);
      setSeconds(RESEND_SECONDS);
      setCode(Array(CODE_LENGTH).fill(""));
      inputs.current[0].focus();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.title}>Código de verificación</Text>
        <Text style={styles.subtitle}>Ingresá el código de 6 dígitos</Text>

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={[styles.codeBox, digit ? styles.codeBoxFilled : null]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.resendRow}>
          {seconds > 0 ? (
            <Text style={styles.resendTimer}>
              Reenviar código ({formatTime(seconds)})
            </Text>
          ) : (
            <TouchableOpacity onPress={handleReenviar}>
              <Text style={styles.resendLink}>Reenviar código</Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          title="Verificar"
          onPress={handleVerificar}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  back: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  container: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  codeBox: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  codeBoxFilled: {
    borderColor: colors.borderFocus,
  },
  resendRow: {
    alignItems: "center",
    marginBottom: 24,
  },
  resendTimer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  resendLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
});
