import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  FACE_SCAN_CAPTURE_STEPS,
  FACE_SCAN_INSTRUCTIONS,
} from "@/lib/faceScanCaptures";

const TEAL = "#6B8E8E";
const N = FACE_SCAN_CAPTURE_STEPS.length;

export default function ScanScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [uris, setUris] = useState<string[]>([]);
  const [scanName, setScanName] = useState("");
  const [busy, setBusy] = useState(false);
  const [resultId, setResultId] = useState<number | null>(null);

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.85,
  };

  const nextIndex = uris.length;
  const isComplete = uris.length >= N;

  async function takeNextPhoto() {
    if (isComplete) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera", "Allow camera access to capture your face scan photos.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      ...pickerOptions,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setUris((prev) => [...prev, res.assets[0].uri]);
      setResultId(null);
    }
  }

  async function pickFiveFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos", "Allow photo library access to choose images.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      ...pickerOptions,
      allowsMultipleSelection: true,
      selectionLimit: N,
    });
    if (res.canceled || !res.assets?.length) return;
    if (res.assets.length !== N) {
      Alert.alert(
        "AI face scan",
        `Select exactly ${N} photos in order (front through left). You picked ${res.assets.length}.`
      );
      return;
    }
    setUris(res.assets.map((a) => a.uri));
    setResultId(null);
  }

  function clearPhotos() {
    setUris([]);
    setResultId(null);
  }

  async function runScan() {
    if (!token || uris.length !== N) {
      Alert.alert("AI face scan", `Capture or choose all ${N} face photos first.`);
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("scanName", scanName.trim() || "Untitled Scan");
      uris.forEach((uri, i) => {
        const ext = uri.split(".").pop()?.toLowerCase();
        const mime =
          ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        form.append("images", {
          uri,
          name: `face-${FACE_SCAN_CAPTURE_STEPS[i].id}.${ext === "png" ? "png" : "jpg"}`,
          type: mime,
        } as unknown as Blob);
      });

      const res = await apiFetch("/api/scan", token, { method: "POST", body: form });
      const data = (await res.json()) as {
        success?: boolean;
        data?: { id?: number };
        error?: string;
      };
      if (!res.ok || !data.success || !data.data?.id) {
        throw new Error(data.error || "Scan failed.");
      }
      setResultId(data.data.id);
      Alert.alert("Done", "Your face scan is saved.", [
        { text: "View report", onPress: () => router.push(`/(drawer)/history/${data.data!.id}`) },
        { text: "OK", style: "cancel" },
      ]);
    } catch (e) {
      Alert.alert("AI face scan", e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>AI face scan</Text>
      <Text style={styles.sub}>
        Face only — we use {N} photos (front, smile, eyes closed, right, left). Results match the
        website.
      </Text>

      <View style={styles.stepsBox}>
        {FACE_SCAN_INSTRUCTIONS.map((line, i) => (
          <Text key={line} style={styles.stepLine}>
            {i + 1}. {line}
          </Text>
        ))}
      </View>

      <Text style={styles.label}>Scan name (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Morning check-in"
        value={scanName}
        onChangeText={setScanName}
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.progress}>
        {isComplete ? `All ${N} photos ready` : `Photo ${nextIndex + 1} of ${N}: ${FACE_SCAN_CAPTURE_STEPS[nextIndex]?.title ?? ""}`}
      </Text>

      <View style={styles.photoActions}>
        <Pressable
          style={[styles.btnHalf, styles.btnCamera, busy && styles.disabled]}
          onPress={takeNextPhoto}
          disabled={busy || isComplete}
        >
          <Text style={styles.btnText}>{isComplete ? "All captured" : "Take photo"}</Text>
        </Pressable>
        <Pressable
          style={[styles.btnHalf, styles.btnGallery, busy && styles.disabled]}
          onPress={pickFiveFromLibrary}
          disabled={busy}
        >
          <Text style={styles.btnTextDark}>Choose {N} photos</Text>
        </Pressable>
      </View>

      {uris.length > 0 ? (
        <View style={styles.previewRow}>
          {uris.map((u, i) => (
            <Image key={`${u}-${i}`} source={{ uri: u }} style={styles.thumb} resizeMode="cover" />
          ))}
        </View>
      ) : null}

      {uris.length > 0 && !isComplete ? (
        <Pressable style={styles.linkBtn} onPress={clearPhotos}>
          <Text style={styles.linkMuted}>Start over</Text>
        </Pressable>
      ) : null}

      {isComplete ? (
        <Pressable style={styles.linkBtn} onPress={clearPhotos}>
          <Text style={styles.linkMuted}>Retake all</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={[styles.btn, styles.btnPrimary, (!isComplete || busy) && styles.disabled]}
        onPress={runScan}
        disabled={!isComplete || busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Analyze & save</Text>
        )}
      </Pressable>

      {resultId != null ? (
        <Pressable style={styles.linkBtn} onPress={() => router.push(`/(drawer)/history/${resultId}`)}>
          <Text style={styles.linkText}>Open last report</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fdf9f0" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#18181b", textAlign: "center" },
  sub: { fontSize: 14, color: "#52525b", textAlign: "center", marginTop: 8, lineHeight: 20 },
  stepsBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f4f4f5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e4e4e7",
  },
  stepLine: { fontSize: 13, color: "#3f3f46", marginBottom: 6, lineHeight: 18 },
  label: { fontSize: 13, color: "#52525b", marginTop: 20, marginBottom: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  progress: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#27272a",
    textAlign: "center",
  },
  photoActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  btnHalf: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCamera: { backgroundColor: TEAL },
  btnGallery: { backgroundColor: "#e4e4e7" },
  btn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#e4e4e7",
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: TEAL },
  disabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  btnTextDark: { fontSize: 16, fontWeight: "600", color: "#27272a" },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    justifyContent: "center",
  },
  thumb: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#e4e4e7",
  },
  linkBtn: { marginTop: 12, alignItems: "center" },
  linkText: { color: "#0d9488", fontWeight: "600", fontSize: 15 },
  linkMuted: { color: "#71717a", fontWeight: "500", fontSize: 14 },
});
