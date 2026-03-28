import "dotenv/config";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { DEMO_LOGIN_EMAIL } from "../lib/auth/demo-login";
import { dateOnlyFromYmd, localCalendarYmd } from "../lib/date-only";
import { db } from "./index";
import { users, skinScans, appointments, dailyLogs } from "./schema";

const DEMO_PATIENT_EMAIL = DEMO_LOGIN_EMAIL;
const DEMO_PATIENT_PASSWORD = "SkinFitDemo2024!";
const DOCTOR_EMAIL = "doctor@skinfit.com";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    const patientHash = await bcrypt.hash(DEMO_PATIENT_PASSWORD, 10);
    const doctorHash = await bcrypt.hash("DocDemo2024!", 10);

    // 1. Ensure demo users exist (safe to run multiple times)
    await db
      .insert(users)
      .values({
        name: "Demo Patient",
        email: DEMO_PATIENT_EMAIL,
        passwordHash: patientHash,
        role: "patient",
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash: patientHash,
          name: "Demo Patient",
          role: "patient",
        },
      });

    await db
      .insert(users)
      .values({
        name: "Dr. Sarah Chen",
        email: DOCTOR_EMAIL,
        passwordHash: doctorHash,
        role: "doctor",
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash: doctorHash,
          name: "Dr. Sarah Chen",
          role: "doctor",
        },
      });

    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_PATIENT_EMAIL))
      .limit(1);
    const [doctor] = await db
      .select()
      .from(users)
      .where(eq(users.email, DOCTOR_EMAIL))
      .limit(1);

    if (!patient || !doctor) {
      throw new Error("Could not load demo users after upsert.");
    }

    console.log("✓ Demo patient:", patient.email);
    console.log("✓ Demo doctor:", doctor.email);

    // 2. Sample skin scan (once per empty history)
    const existingScans = await db
      .select({ id: skinScans.id })
      .from(skinScans)
      .where(eq(skinScans.userId, patient.id))
      .limit(1);

    if (existingScans.length === 0) {
      const [scan] = await db
        .insert(skinScans)
        .values({
          userId: patient.id,
          originalImageUrl:
            "https://example.com/scans/test-patient-original.jpg",
          annotatedImageUrl:
            "https://example.com/scans/test-patient-annotated.jpg",
          skinScore: 88,
          analysisResults: {
            acne: 10,
            wrinkles: 20,
            pigmentation: 15,
            hydration: 85,
            texture: 90,
            redness: 8,
            darkCircles: 25,
            poreSize: 12,
          },
        })
        .returning();
      console.log("✓ Created skin scan with score:", scan.skinScore);
    } else {
      console.log("✓ Skin scan already present; skipping");
    }

    // 3. Appointments (only if none yet)
    const existingAppts = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.userId, patient.id))
      .limit(1);

    if (existingAppts.length === 0) {
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(now.getDate() - 7);
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + 5);
      futureDate.setHours(14, 30, 0, 0);

      await db.insert(appointments).values([
        {
          userId: patient.id,
          doctorId: doctor.id,
          dateTime: pastDate,
          status: "completed",
          type: "consultation",
        },
        {
          userId: patient.id,
          doctorId: doctor.id,
          dateTime: futureDate,
          status: "scheduled",
          type: "follow-up",
        },
      ]);
      console.log("✓ Created 2 appointments (1 past, 1 upcoming)");
    } else {
      console.log("✓ Appointments already present; skipping");
    }

    // 4. Daily log for today (once) — UTC-noon Date so PG `date` matches calendar day
    const today = dateOnlyFromYmd(localCalendarYmd());

    const existingLog = await db
      .select({ id: dailyLogs.id })
      .from(dailyLogs)
      .where(
        and(eq(dailyLogs.userId, patient.id), eq(dailyLogs.date, today))
      )
      .limit(1);

    if (existingLog.length === 0) {
      await db.insert(dailyLogs).values({
        userId: patient.id,
        date: today,
        amRoutine: true,
        pmRoutine: false,
        mood: "Energized",
        sleepHours: 7,
        stressLevel: 4,
        waterGlasses: 8,
        journalEntry:
          "Feeling great today! The new skincare routine is really making a difference. Noticed less redness in the morning.",
      });
      console.log("✓ Created daily log for today");
    } else {
      console.log("✓ Daily log for today already present; skipping");
    }

    console.log("\n✅ Seeding completed successfully!");
    console.log("\nPatient demo login (email only for now):");
    console.log(`  Email: ${DEMO_PATIENT_EMAIL}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }

  process.exit(0);
}

seed();
