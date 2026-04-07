import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { router } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiJson } from "@/lib/api";
import { apiUrl } from "@/lib/apiBase";

const REMINDER_HOURS_MAX = 168;
const REMINDER_DEFAULT = 24;

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  phoneCountryCode: string;
  phone: string | null;
  age: number | null;
  skinType: string | null;
  primaryGoal: string | null;
  appointmentReminderHoursBefore: number;
  timezone: string;
  routineRemindersEnabled: boolean;
  routineAmReminderHm: string;
  routinePmReminderHm: string;
};

export default function ProfileScreen() {
  const { token, applySessionFromProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [skinType, setSkinType] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [reminderHours, setReminderHours] = useState(String(REMINDER_DEFAULT));
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [routineRemindersEnabled, setRoutineRemindersEnabled] = useState(true);
  const [routineAmHm, setRoutineAmHm] = useState("08:30");
  const [routinePmHm, setRoutinePmHm] = useState("22:00");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const { user } = await apiJson<{ user: ProfileUser }>("/api/user/profile", token, {
        method: "GET",
      });
      setName(user.name);
      setEmail(user.email);
      setPhoneCountryCode(user.phoneCountryCode ?? "+91");
      setPhone(user.phone ?? "");
      setAge(user.age != null ? String(user.age) : "");
      setSkinType(user.skinType ?? "");
      setPrimaryGoal(user.primaryGoal ?? "");
      setReminderHours(String(user.appointmentReminderHoursBefore ?? REMINDER_DEFAULT));
      setTimezone(user.timezone ?? "Asia/Kolkata");
      setRoutineRemindersEnabled(user.routineRemindersEnabled ?? true);
      setRoutineAmHm(user.routineAmReminderHm ?? "08:30");
      setRoutinePmHm(user.routinePmReminderHm ?? "22:00");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function onSave() {
    if (!token) return;
    setError(null);
    if (newPassword || currentPassword) {
      if (newPassword !== confirmPassword) {
        setError("New password and confirmation do not match.");
        return;
      }
    }
    const rh = Number.parseInt(reminderHours.trim(), 10);
    if (!Number.isFinite(rh) || rh < 0 || rh > REMINDER_HOURS_MAX) {
      setError(`Reminder must be 0 (off) or 1–${REMINDER_HOURS_MAX} hours before a visit.`);
      return;
    }
    const ageTrim = age.trim();
    let ageVal: number | null = null;
    if (ageTrim !== "") {
      const n = Number.parseInt(ageTrim, 10);
      if (!Number.isFinite(n) || n < 1 || n > 120) {
        setError("Age must be 1–120 or blank.");
        return;
      }
      ageVal = n;
    }

    setSaving(true);
    try {
      const hmOk = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!hmOk.test(routineAmHm.trim()) || !hmOk.test(routinePmHm.trim())) {
        setError("Routine reminder times must be HH:mm (24h), e.g. 08:30 and 22:00.");
        setSaving(false);
        return;
      }

      const body: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        phoneCountryCode: phoneCountryCode.trim() || "+91",
        phone: phone.trim(),
        skinType: skinType.trim() || null,
        primaryGoal: primaryGoal.trim() || null,
        age: ageVal,
        appointmentReminderHoursBefore: rh,
        timezone: timezone.trim() || "Asia/Kolkata",
        routineRemindersEnabled,
        routineAmReminderHm: routineAmHm.trim(),
        routinePmReminderHm: routinePmHm.trim(),
      };
      if (newPassword || currentPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch(apiUrl("/api/user/profile"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Skinfit-Client": "native",
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        token?: string;
        user?: ProfileUser;
      };
      if (!res.ok) {
        throw new Error(data.message || "Could not save.");
      }
      if (data.user) {
        await applySessionFromProfile({
          token: data.token,
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
          },
        });
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Profile", "Saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your profile</Text>
      <Text style={styles.sub}>Same fields as the web portal.</Text>
      {error ? <Text style={styles.err}>{error}</Text> : null}

      <L label="Name" value={name} onChangeText={setName} />
      <L label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <L label="Country code" value={phoneCountryCode} onChangeText={setPhoneCountryCode} />
      <L label="Phone (national digits)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <L label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
      <L label="Skin type" value={skinType} onChangeText={setSkinType} />
      <L label="Primary goal" value={primaryGoal} onChangeText={setPrimaryGoal} />
      <L
        label={`Visit reminder (hours before, 0=off, max ${REMINDER_HOURS_MAX})`}
        value={reminderHours}
        onChangeText={setReminderHours}
        keyboardType="number-pad"
      />

      <Text style={styles.section}>Daily routine reminders (Clinic Support)</Text>
      <View style={styles.switchRow}>
        <Text style={styles.lab}>Enable AM/PM routine reminders</Text>
        <Switch
          value={routineRemindersEnabled}
          onValueChange={setRoutineRemindersEnabled}
          trackColor={{ false: "#d4d4d8", true: "#99f6e4" }}
          thumbColor={routineRemindersEnabled ? "#0d9488" : "#f4f4f5"}
        />
      </View>
      <L label="Timezone (IANA, e.g. Asia/Kolkata)" value={timezone} onChangeText={setTimezone} />
      <Pressable
        style={styles.tzBtn}
        onPress={() => {
          try {
            setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
          } catch {
            /* ignore */
          }
        }}
      >
        <Text style={styles.tzBtnText}>Use this device timezone</Text>
      </Pressable>
      <L
        label="Morning reminder (HH:mm 24h)"
        value={routineAmHm}
        onChangeText={setRoutineAmHm}
        autoCapitalize="none"
      />
      <L
        label="Evening reminder (HH:mm 24h)"
        value={routinePmHm}
        onChangeText={setRoutinePmHm}
        autoCapitalize="none"
      />

      <Text style={styles.section}>Change password (optional)</Text>
      <L
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secure
      />
      <L label="New password" value={newPassword} onChangeText={setNewPassword} secure />
      <L label="Confirm new" value={confirmPassword} onChangeText={setConfirmPassword} secure />

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDis]} onPress={onSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save profile"}</Text>
      </Pressable>

      <Pressable
        style={styles.outBtn}
        onPress={() => {
          Alert.alert("Sign out", "You will need to sign in again.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign out",
              style: "destructive",
              onPress: async () => {
                await signOut();
                router.replace("/login");
              },
            },
          ]);
        }}
      >
        <Text style={styles.outBtnText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function L({
  label,
  value,
  onChangeText,
  secure,
  autoCapitalize = "sentences",
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  secure?: boolean;
  autoCapitalize?: "none" | "sentences";
  keyboardType?: "default" | "number-pad" | "phone-pad";
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.lab}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fdf9f0" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fdf9f0" },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  sub: { textAlign: "center", color: "#52525b", marginBottom: 16 },
  err: { color: "#b91c1c", marginBottom: 12 },
  lab: { fontSize: 13, color: "#52525b", marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e4e4e7",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  section: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#0d9488",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnDis: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  outBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#0d9488",
    alignItems: "center",
  },
  outBtnText: { color: "#0d9488", fontWeight: "700", fontSize: 16 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  tzBtn: {
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e4e4e7",
    backgroundColor: "#fafafa",
    alignSelf: "flex-start",
  },
  tzBtnText: { fontSize: 14, fontWeight: "600", color: "#0f766e" },
});
