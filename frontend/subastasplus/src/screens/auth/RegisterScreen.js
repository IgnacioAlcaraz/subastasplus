import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { colors, typography } from "../../constants";
import { getPaises } from "../../api/paises";
import { registroEtapa1 } from "../../api/registro";

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [domicilioLegal, setDomicilioLegal] = useState("");
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);
  const [dniFrente, setDniFrente] = useState(null);
  const [dniDorso, setDniDorso] = useState(null);
  const [paises, setPaises] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPaises()
      .then(setPaises)
      .catch(() => Alert.alert("Error", "No se pudieron cargar los países"));
  }, []);

  async function pickImage(lado) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para fotografiar el documento');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const base64 = result.assets[0].base64;
      lado === "frente" ? setDniFrente(base64) : setDniDorso(base64);
    }
  }

  async function handleEnviar() {
    if (
      !nombre ||
      !apellido ||
      !email ||
      !domicilioLegal ||
      !paisSeleccionado
    ) {
      Alert.alert("Campos incompletos", "Completá todos los campos");
      return;
    }
    if (!dniFrente || !dniDorso) {
      Alert.alert("Fotos requeridas", "Agregá las dos fotos del documento");
      return;
    }

    setLoading(true);
    try {
      const data = await registroEtapa1({
        nombre,
        apellido,
        email,
        domicilioLegal,
        paisOrigen: paisSeleccionado.nombre,
        dniFrente,
        dniDorso,
      });
      navigation.navigate("PendingApproval", {
        tokenSeguimiento: data.tokenSeguimiento,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.paso}>Paso 1 de 2</Text>
        </View>

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Completá tus datos personales</Text>

        <Input
          label="Nombre"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Juan"
        />
        <Input
          label="Apellido"
          value={apellido}
          onChangeText={setApellido}
          placeholder="Pérez"
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="juan@email.com"
          keyboardType="email-address"
        />

        <Text style={styles.label}>País de origen</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setModalVisible(true)}
        >
          <Text
            style={
              paisSeleccionado ? styles.pickerText : styles.pickerPlaceholder
            }
          >
            {paisSeleccionado ? paisSeleccionado.nombre : "Seleccioná un país"}
          </Text>
          <Text style={styles.pickerArrow}>▼</Text>
        </TouchableOpacity>

        <Input
          label="Domicilio legal"
          value={domicilioLegal}
          onChangeText={setDomicilioLegal}
          placeholder="Av. Corrientes 1234"
        />

        <Text style={styles.label}>Foto del documento</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity
            style={styles.photoBox}
            onPress={() => pickImage("frente")}
          >
            {dniFrente ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${dniFrente}` }}
                style={styles.photoPreview}
              />
            ) : (
              <Text style={styles.photoPlus}>+</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.photoBox}
            onPress={() => pickImage("dorso")}
          >
            {dniDorso ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${dniDorso}` }}
                style={styles.photoPreview}
              />
            ) : (
              <Text style={styles.photoPlus}>+</Text>
            )}
          </TouchableOpacity>
        </View>

        <Button
          title="Enviar solicitud"
          onPress={handleEnviar}
          disabled={loading}
        />
        <Text style={styles.notice}>
          Te enviaremos un email cuando tu cuenta sea aprobada
        </Text>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>País de origen</Text>
            <FlatList
              data={paises}
              keyExtractor={(item) => String(item.numero)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setPaisSeleccionado(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backText: { fontSize: 24, color: colors.textPrimary },
  paso: { ...typography.bodySmall, color: colors.textSecondary },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
  picker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  pickerText: { ...typography.body, color: colors.textPrimary },
  pickerPlaceholder: { ...typography.body, color: colors.textDisabled },
  pickerArrow: { color: colors.textSecondary },
  photoRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  photoBox: {
    flex: 1,
    height: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPreview: { width: "100%", height: "100%", borderRadius: 10 },
  photoPlus: { fontSize: 28, color: colors.textDisabled },
  notice: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    padding: 24,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: 16 },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: { ...typography.body, color: colors.textPrimary },
  modalClose: { paddingVertical: 16, alignItems: "center" },
  modalCloseText: { ...typography.button, color: colors.error },
});
