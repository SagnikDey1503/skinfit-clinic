"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Sparkles, RotateCcw, Check } from "lucide-react";
import { SkinScanReportModal } from "../../../components/dashboard/SkinScanReportModal";

type ScanStep = "upload" | "confirm" | "naming" | "scanning" | "results";

interface ScanMetrics {
  acne: number;
  pigmentation: number;
  wrinkles: number;
  hydration: number;
  texture: number;
  overall_score: number;
}

interface DetectedRegion {
  issue: string;
  coordinates: { x: number; y: number };
}

interface ScanResults {
  metrics: ScanMetrics;
  detected_regions: DetectedRegion[];
  ai_summary?: string;
  userName?: string;
  scanDate?: string;
}

export default function ScanPage() {
  const [step, setStep] = useState<ScanStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanName, setScanName] = useState("");
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [reportOpen, setReportOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (scanResults) setReportOpen(true);
  }, [scanResults]);

  const resetScan = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep("upload");
    setFile(null);
    setPreviewUrl(null);
    setScanName("");
    setScanResults(null);
  }, [previewUrl]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) return;
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setScanResults(null);
    setStep("confirm");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
    e.target.value = "";
  };

  const runScan = useCallback(async () => {
    if (!file || !scanName.trim()) return;
    setStep("scanning");
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("scanName", scanName.trim());
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setScanResults(json.data);
        setStep("results");
      } else {
        setStep("naming");
      }
    } catch {
      setStep("naming");
    }
  }, [file, scanName]);

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-white">
          AI Skin Scan
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload a photo for AI-powered skin analysis
        </p>
      </motion.header>

      {/* Step: Upload */}
      {step === "upload" && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-colors ${
            isDragging
              ? "border-teal-400 bg-teal-400/10"
              : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900/70"
          }`}
          onClick={() => document.getElementById("scan-file-input")?.click()}
        >
          <input
            id="scan-file-input"
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <Camera className="h-8 w-8 text-teal-400" />
          </div>
          <p className="mb-1 font-semibold text-white">Drop your photo here</p>
          <p className="text-sm text-zinc-500">
            or tap to open camera / choose file
          </p>
        </motion.div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && file && previewUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50">
            <div className="relative aspect-[3/4] max-h-[350px] w-full">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setFile(null);
                setPreviewUrl(null);
                setStep("upload");
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Retake Image
            </button>
            <button
              type="button"
              onClick={() => setStep("naming")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-500"
            >
              <Check className="h-4 w-4" />
              Looks Good
            </button>
          </div>
        </motion.div>
      )}

      {/* Step: Naming */}
      {step === "naming" && previewUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50">
            <div className="relative aspect-[3/4] max-h-[280px] w-full">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover grayscale-[20%]"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <label htmlFor="scan-name" className="mb-3 block text-sm font-medium text-zinc-400">
              Name this scan
            </label>
            <input
              id="scan-name"
              type="text"
              placeholder="e.g., Morning Routine"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
            />
          </div>
          <button
            type="button"
            onClick={runScan}
            disabled={!scanName.trim()}
            className="w-full rounded-xl bg-teal-600 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Analysis
          </button>
        </motion.div>
      )}

      {/* Step: Scanning */}
      {step === "scanning" && previewUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/50">
            <div className="relative aspect-[3/4] max-h-[400px] w-full">
              <img
                src={previewUrl}
                alt="Scanning"
                className="h-full w-full object-cover grayscale-[30%]"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/70">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-teal-400/50 border-t-teal-400"
                >
                  <Sparkles className="h-6 w-6 text-teal-400" />
                </motion.div>
                <p className="text-lg font-semibold text-white">Scanning...</p>
                <p className="mt-1 text-sm text-zinc-400">
                  AI is analyzing your skin
                </p>
                <motion.div
                  className="absolute left-0 right-0 z-10 h-1 bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.8)]"
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step: Results — full report modal */}
      {step === "results" && scanResults && previewUrl && (
        <>
          <SkinScanReportModal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            userName={scanResults.userName?.trim() || "there"}
            imageUrl={previewUrl}
            regions={scanResults.detected_regions}
            metrics={{
              acne: scanResults.metrics.acne,
              hydration: scanResults.metrics.hydration,
              wrinkles: scanResults.metrics.wrinkles,
              overall_score: scanResults.metrics.overall_score,
            }}
            aiSummary={scanResults.ai_summary}
            scanDate={
              scanResults.scanDate
                ? new Date(scanResults.scanDate)
                : new Date()
            }
          />
          {!reportOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[22px] border border-zinc-200 bg-white p-8 text-center shadow-sm"
            >
              <p className="text-sm font-medium text-zinc-700">
                Report saved to your history. Start another scan whenever you
                like.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 sm:w-auto"
                >
                  View report again
                </button>
                <button
                  type="button"
                  onClick={resetScan}
                  className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 sm:w-auto"
                  style={{ backgroundColor: "#6D8C8E" }}
                >
                  Scan another photo
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
