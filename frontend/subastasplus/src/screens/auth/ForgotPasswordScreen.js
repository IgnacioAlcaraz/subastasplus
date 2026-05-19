import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { colors, typography } from "../../constants";
import { recuperarClave } from "../../api/auth";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEnviar() {
    if (!email) {
      Alert.alert("Campo incompleto", "Ingresá tu email");
      return;
    }

    setLoading(true);
    try {
      await recuperarClave(email);
      navigation.navigate("VerifyCode", { email });
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresá tu email para recibir un código de verificación
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          keyboardType="email-address"
        />

        <Button
          title="Enviar código"
          onPress={handleEnviar}
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
});
