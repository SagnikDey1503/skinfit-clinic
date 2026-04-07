/** Ordered face-only AI scan poses (5 captures). */
export const FACE_SCAN_CAPTURE_STEPS = [
  {
    id: "front",
    title: "Front face",
    instruction: "Look straight at the camera.",
  },
  {
    id: "smile",
    title: "Smile",
    instruction: "Take a natural smile.",
  },
  {
    id: "no_smile_closed_eyes",
    title: "No smile, eyes closed",
    instruction: "Relax your face with eyes closed.",
  },
  {
    id: "right",
    title: "Right profile",
    instruction: "Turn so your right cheek faces the camera.",
  },
  {
    id: "left",
    title: "Left profile",
    instruction: "Turn so your left cheek faces the camera.",
  },
] as const;

export type FaceScanCaptureId = (typeof FACE_SCAN_CAPTURE_STEPS)[number]["id"];

export const FACE_SCAN_INSTRUCTIONS_BELOW_CAMERA = [
  "Take a front face picture.",
  "Take an image with smile.",
  "Take an image without smile and closed eyes.",
  "Take picture from right side.",
  "Take picture from left side.",
] as const;
