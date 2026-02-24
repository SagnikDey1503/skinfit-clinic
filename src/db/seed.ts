import "dotenv/config";
import { db } from "./index";
import { users, skinScans, appointments, dailyLogs } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // 1. Create a test patient user
    const [patient] = await db
      .insert(users)
      .values({
        name: "Test Patient",
        email: "test@skinfit.com",
        passwordHash: "$2a$10$placeholder.hash.for.password123", // In production, use bcrypt.hash()
        role: "patient",
      })
      .returning();

    console.log("✓ Created patient:", patient.email);

    // 2. Create a doctor user (needed for appointments)
    const [doctor] = await db
      .insert(users)
      .values({
        name: "Dr. Sarah Chen",
        email: "doctor@skinfit.com",
        passwordHash: "$2a$10$placeholder.hash.for.doctor",
        role: "doctor",
      })
      .returning();

    console.log("✓ Created doctor:", doctor.email);

    // 3. Create a skin scan for the patient
    const [scan] = await db
      .insert(skinScans)
      .values({
        userId: patient.id,
        originalImageUrl: "https://example.com/scans/test-patient-original.jpg",
        annotatedImageUrl: "https://example.com/scans/test-patient-annotated.jpg",
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

    // 4. Create appointments (one past, one upcoming)
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - 7); // 7 days ago

    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + 5); // 5 days from now
    futureDate.setHours(14, 30, 0, 0); // 2:30 PM

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

    // 5. Create a daily log for today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    await db.insert(dailyLogs).values({
      userId: patient.id,
      date: today,
      amRoutine: true,
      pmRoutine: false,
      mood: "Energized",
      journalEntry:
        "Feeling great today! The new skincare routine is really making a difference. Noticed less redness in the morning.",
    });

    console.log("✓ Created daily log for today");

    console.log("\n✅ Seeding completed successfully!");
    console.log("\nTest credentials:");
    console.log("  Email: test@skinfit.com");
    console.log("  Password: password123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }

  process.exit(0);
}

seed();
