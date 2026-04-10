/** Single front-face capture for AI scan (matches clinical model input). */
export const FACE_SCAN_CAPTURE_STEPS = [
  {
    id: "front",
    title: "Front face",
    instruction: "Look straight at the camera. Use good lighting and fill the frame with your face.",
  },
] as const;

export type FaceScanCaptureId = (typeof FACE_SCAN_CAPTURE_STEPS)[number]["id"];

export const FACE_SCAN_INSTRUCTIONS_BELOW_CAMERA = [
  "One clear front-facing photo — neutral expression, eyes open, no sunglasses.",
] as const;
