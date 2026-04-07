/** Keep in sync with repo root `src/lib/faceScanCaptures.ts` (face-only, 5 poses). */
export const FACE_SCAN_CAPTURE_STEPS = [
  { id: "front", title: "Front face" },
  { id: "smile", title: "Smile" },
  { id: "no_smile_closed_eyes", title: "No smile, eyes closed" },
  { id: "right", title: "Right side" },
  { id: "left", title: "Left side" },
] as const;

export const FACE_SCAN_INSTRUCTIONS = [
  "Take a front face picture.",
  "Take an image with smile.",
  "Take an image without smile and closed eyes.",
  "Take picture from right side.",
  "Take picture from left side.",
] as const;
