import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { colors, typography } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { login } from "../../api/auth";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: saveSession, continueAsGuest } = useAuth();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Campos incompletos", "Completá email y contraseña");
      return;
    }

    setLoading(true);
    try {
      const { token, refreshToken, usuario } = await login(email, password);

      if (usuario.estado === "pendiente_aprobacion") {
        Alert.alert("Cuenta pendiente", "Tu cuenta está siendo revisada. Te avisamos cuando esté aprobada.");
        return;
      }
      if (usuario.estado === "bloqueado_multa") {
        Alert.alert("Cuenta bloqueada", "Tenés una multa pendiente. Contactate con soporte.");
        return;
      }

      await saveSession(token, usuario, refreshToken);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>SubastaPlus</Text>
          <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="juan@email.com"
              keyboardType="email-address"
            />
            <Input
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            <TouchableOpacity style={styles.forgotContainer} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Olvidé mi contraseña</Text>
            </TouchableOpacity>
          </View>

          <Button title="Iniciar sesión" onPress={handleLogin} disabled={loading} />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>¿No tenés cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Continuar como invitado"
            variant="outline"
            onPress={continueAsGuest}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  forgotContainer: {
    alignSelf: "flex-end",
  },
  forgotText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  registerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
});
