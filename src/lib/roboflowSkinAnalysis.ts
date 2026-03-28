export type RoboflowSkinAnnotation = {
  engine: string;
  type: string;
  severity: number;
  box: [number, number, number, number];
};

export type RoboflowFinalScores = {
  acneAndInflammation: number;
  wrinkles: number;
  pigmentation: number;
  hydration: number;
  overallHealth: number;
};

export async function runRoboflowSkinAnalysis(base64Image: string): Promise<{
  annotations: RoboflowSkinAnnotation[];
  acneScore: number;
  finalScores: RoboflowFinalScores;
}> {
  const cleanBase64 = base64Image.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ""
  );

  const roboflowUrl = `https://detect.roboflow.com/acne-detection-9z3qf/3?api_key=${process.env.ROBOFLOW_API_KEY}`;

  const response = await fetch(roboflowUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: cleanBase64,
  });

  const visionData = await response.json();

  if (!visionData.predictions) {
    throw new Error("Roboflow API failed to return predictions.");
  }

  const imgW = visionData.image.width;
  const imgH = visionData.image.height;

  const annotations: RoboflowSkinAnnotation[] = visionData.predictions.map(
    (pred: {
      x: number;
      y: number;
      width: number;
      height: number;
      class: string;
      confidence: number;
    }) => {
      const x_min = (pred.x - pred.width / 2) / imgW;
      const y_min = (pred.y - pred.height / 2) / imgH;
      const x_max = (pred.x + pred.width / 2) / imgW;
      const y_max = (pred.y + pred.height / 2) / imgH;

      return {
        engine: "Active Acne",
        type: pred.class,
        severity: Math.min(5, Math.ceil(pred.confidence * 5)),
        box: [
          Math.max(0, x_min),
          Math.max(0, y_min),
          Math.min(1, x_max),
          Math.min(1, y_max),
        ],
      };
    }
  );

  const acneScore = Math.max(0, 100 - annotations.length * 5);

  const finalScores: RoboflowFinalScores = {
    acneAndInflammation: acneScore,
    wrinkles: 85,
    pigmentation: 80,
    hydration: 75,
    overallHealth: acneScore,
  };

  return { annotations, acneScore, finalScores };
}
