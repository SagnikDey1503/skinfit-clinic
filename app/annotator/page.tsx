"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Trash2,
  Pencil,
  Minus,
  Eraser,
  Sun,
  Moon,
  Info,
  X,
} from "lucide-react";

const CLINICAL_TAXONOMY: Record<string, string[]> = {
  "Active Acne": ["Comedones (Black/Whiteheads)", "Papules / Pustules", "Nodules / Cysts", "Inflammation (Erythema)"],
  "Acne Scars": ["Ice-pick", "Boxcar", "Rolling"],
  "Skin Quality": ["Pore Density & Size", "Oiliness", "Dryness / Flaking"],
  Pigmentation: ["Melasma", "Post-Acne Marks (PIH/PIE)", "Sun Spots"],
  Wrinkles: ["Forehead & Glabella", "Crow's Feet", "Nasolabial & Marionette"],
  "Sagging & Volume": ["Tear Trough", "Midface Flattening", "Jowl & Jawline"],
  "Under-Eye": ["Puffiness (Fluid/Fat)", "Dark Circles (Pigmented/Vascular)"],
  "Hair Health": ["Hairline Recession", "Miniaturization", "Overall Density"],
};

const CATEGORY_COLORS: Record<string, string> = {
  "Active Acne": "rgb(239, 68, 68)",
  "Acne Scars": "rgb(185, 28, 28)",
  "Skin Quality": "rgb(34, 197, 94)",
  Pigmentation: "rgb(59, 130, 246)",
  Wrinkles: "rgb(168, 85, 247)",
  "Sagging & Volume": "rgb(236, 72, 153)",
  "Under-Eye": "rgb(14, 165, 233)",
  "Hair Health": "rgb(245, 158, 11)",
};

interface Annotation {
  id: string;
  imageIndex: number;
  category: string;
  spec: string;
  severity: number;
  color: string;
  type: "path" | "line";
  points: { x: number; y: number }[];
}

let annotationIdCounter = 0;

function getNormalizedPoint(
  e: React.MouseEvent,
  el: HTMLDivElement | null
): { x: number; y: number } | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  return { x, y };
}

function pointsToPathD(points: { x: number; y: number }[], close: boolean): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`;
  }
  if (close && points.length > 2) d += " Z";
  return d;
}

function pointsToPolylinePoints(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export default function AnnotatorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(Date.now());

  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<string>("path");
  const [activeCategory, setActiveCategory] = useState<string>("Active Acne");
  const [activeSpec, setActiveSpec] = useState<string>("Comedones (Black/Whiteheads)");
  const [severity, setSeverity] = useState<number>(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    step: "category" | "spec" | "severity";
    tempCategory?: string;
    tempSpec?: string;
  } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (images.length === 0) return;
      const now = Date.now();
      if (now - lastScrollTime.current < 400) return;

      if (e.deltaX > 40) {
        setCurrentIndex((prev) => Math.min(images.length - 1, prev + 1));
        lastScrollTime.current = now;
      } else if (e.deltaX < -40) {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        lastScrollTime.current = now;
      }
    },
    [images.length]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (images.length === 0) return;
      const pt = getNormalizedPoint(e, canvasRef.current);
      if (!pt) return;

      if (activeTool === "path" || activeTool === "line") {
        setIsDrawing(true);
        setCurrentStrokePoints([pt]);
      }
      // Eraser: handled by shape onClick
    },
    [images.length, activeTool]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing || (activeTool !== "path" && activeTool !== "line")) return;
      const pt = getNormalizedPoint(e, canvasRef.current);
      if (!pt) return;
      setCurrentStrokePoints((prev) => [...prev, pt]);
    },
    [isDrawing, activeTool]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    if (activeTool === "path" && currentStrokePoints.length >= 3) {
      const color = CATEGORY_COLORS[activeCategory] ?? "rgb(156, 163, 175)";
      setAnnotations((prev) => [
        ...prev,
        {
          id: `ann-${++annotationIdCounter}`,
          imageIndex: currentIndex,
          category: activeCategory,
          spec: activeSpec,
          severity,
          color,
          type: "path",
          points: [...currentStrokePoints],
        },
      ]);
    } else if (activeTool === "line" && currentStrokePoints.length >= 2) {
      const color = CATEGORY_COLORS[activeCategory] ?? "rgb(156, 163, 175)";
      setAnnotations((prev) => [
        ...prev,
        {
          id: `ann-${++annotationIdCounter}`,
          imageIndex: currentIndex,
          category: activeCategory,
          spec: activeSpec,
          severity,
          color,
          type: "line",
          points: [...currentStrokePoints],
        },
      ]);
    }
    setIsDrawing(false);
    setCurrentStrokePoints([]);
  }, [isDrawing, activeTool, currentStrokePoints, currentIndex, activeCategory, activeSpec, severity]);

  React.useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...urls]);
    setCurrentIndex(0);
    e.target.value = "";
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    const specs = CLINICAL_TAXONOMY[cat] ?? [];
    setActiveSpec(specs[0] ?? "");
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleShapeClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (activeTool === "eraser") {
        deleteAnnotation(id);
      }
    },
    [activeTool]
  );

  const specs = CLINICAL_TAXONOMY[activeCategory] ?? [];
  const currentAnnotations = annotations.filter((a) => a.imageIndex === currentIndex);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Top Nav */}
      <nav className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center gap-4">
          <Link
            href="/clinic"
            className="text-slate-500 transition-colors hover:text-teal-500 dark:text-zinc-500 dark:hover:text-teal-400"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Skinnfit Clinical Annotator
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsDarkMode((d) => !d)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-teal-400"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-teal-400"
            title="View tutorial"
          >
            <Info className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-teal-400"
          >
            <Upload className="h-4 w-4" />
            Upload Images
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
        {/* Left Canvas */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden bg-slate-100 p-6 dark:bg-zinc-950">
          {images.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-zinc-500">
              <div className="rounded-full border-2 border-dashed border-slate-300 p-8 dark:border-zinc-700">
                <Upload className="h-16 w-16" />
              </div>
              <p className="text-sm">No images uploaded</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300"
              >
                Click to upload images
              </button>
            </div>
          ) : (
            <>
              <div className="relative flex max-h-[calc(100vh-180px)] w-full max-w-4xl items-center justify-center">
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/80 text-white transition-colors hover:bg-slate-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <div
                  ref={canvasRef}
                  className="relative inline-block max-h-[calc(100vh-180px)] select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onWheel={handleWheel}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const safeX = e.clientX + 260 > window.innerWidth ? window.innerWidth - 270 : e.clientX;
                    const safeY = e.clientY + 350 > window.innerHeight ? window.innerHeight - 360 : e.clientY;
                    setContextMenu({
                      visible: true,
                      x: safeX,
                      y: safeY,
                      step: "category",
                    });
                  }}
                >
                  <img
                    src={images[currentIndex]}
                    alt={`Scan ${currentIndex + 1}`}
                    className="max-h-full w-auto object-contain"
                    draggable={false}
                  />

                  {/* SVG Drawing Layer */}
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 1 1"
                    preserveAspectRatio="none"
                    style={{ pointerEvents: activeTool === "eraser" ? "auto" : "none" }}
                  >
                    {/* Rendered annotations */}
                    {currentAnnotations.map((ann) => (
                      <g
                        key={ann.id}
                        style={{
                          cursor: activeTool === "eraser" ? "pointer" : "default",
                          pointerEvents: "painted",
                        }}
                        onClick={(e) => handleShapeClick(e as unknown as React.MouseEvent, ann.id)}
                      >
                        {ann.type === "path" ? (
                          <path
                            d={pointsToPathD(ann.points, true)}
                            fill={ann.color}
                            fillOpacity={0.25}
                            stroke={ann.color}
                            strokeWidth={0.005}
                            className={activeTool === "eraser" ? "hover:opacity-80" : ""}
                          />
                        ) : (
                          <polyline
                            points={pointsToPolylinePoints(ann.points)}
                            fill="none"
                            stroke={ann.color}
                            strokeWidth={0.005}
                            className={activeTool === "eraser" ? "hover:opacity-80" : ""}
                          />
                        )}
                        <text
                          x={ann.points[0]?.x ?? 0}
                          y={(ann.points[0]?.y ?? 0) - 0.03}
                          fontSize={0.03}
                          fill={ann.color}
                          fontWeight="bold"
                          style={{ pointerEvents: "none" }}
                        >
                          {ann.spec} - {ann.severity}
                        </text>
                      </g>
                    ))}

                    {/* Drawing preview */}
                    {isDrawing && currentStrokePoints.length >= 2 && (
                      <>
                        {activeTool === "path" ? (
                          <path
                            d={pointsToPathD(currentStrokePoints, false)}
                            fill="rgb(45, 212, 191)"
                            fillOpacity={0.25}
                            stroke="rgb(45, 212, 191)"
                            strokeWidth={0.005}
                            strokeDasharray="0.01 0.01"
                          />
                        ) : (
                          <polyline
                            points={pointsToPolylinePoints(currentStrokePoints)}
                            fill="none"
                            stroke="rgb(45, 212, 191)"
                            strokeWidth={0.005}
                            strokeDasharray="0.01 0.01"
                          />
                        )}
                      </>
                    )}
                  </svg>
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/80 text-white transition-colors hover:bg-slate-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-zinc-500">
                Image {currentIndex + 1} of {images.length}
              </p>
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="flex flex-col overflow-y-auto border-l border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <Crosshair className="h-4 w-4 text-teal-400" />
            Annotation Tools
          </h2>

          {/* Toolbox */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTool("path")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTool === "path"
                  ? "bg-teal-500 text-zinc-950"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              <Pencil className="h-4 w-4" />
              Path
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("line")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTool === "line"
                  ? "bg-teal-500 text-zinc-950"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              <Minus className="h-4 w-4" />
              Line
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("eraser")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTool === "eraser"
                  ? "bg-teal-500 text-zinc-950"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              <Eraser className="h-4 w-4" />
              Eraser
            </button>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(CLINICAL_TAXONOMY).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-teal-500 text-zinc-950"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Specification */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Specification
            </label>
            <div className="flex flex-wrap gap-2">
              {specs.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setActiveSpec(spec)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeSpec === spec
                      ? "bg-teal-500/80 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Severity (1–5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeverity(n)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    severity === n
                      ? "bg-amber-500 text-zinc-950"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Annotation List */}
          <div className="mt-auto pt-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Annotation List
            </label>
            <div className="space-y-2">
              {currentAnnotations.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500 dark:text-zinc-500">
                  Use Path or Line tool to draw on the image
                </p>
              ) : (
                currentAnnotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900 dark:text-white">
                        {ann.spec} - {ann.severity}
                      </p>
                      <p className="truncate text-[10px] text-slate-500 dark:text-zinc-500">
                        {ann.category} ({ann.type})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAnnotation(ann.id)}
                      className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-red-500/20 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Context Menu */}
      {contextMenu?.visible && (
        <div
          className="fixed z-[9999] w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 context-menu-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Section: Mini-Toolbar */}
          <div className="border-b border-slate-200 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex justify-between gap-1">
              <button
                type="button"
                className={`rounded p-1.5 transition-colors ${
                  activeTool === "path" ? "bg-teal-500 text-zinc-950" : "text-slate-500 hover:bg-slate-200 hover:text-teal-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-teal-400"
                }`}
                onClick={() => setActiveTool("path")}
                title="Path"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`rounded p-1.5 transition-colors ${
                  activeTool === "line" ? "bg-teal-500 text-zinc-950" : "text-slate-500 hover:bg-slate-200 hover:text-teal-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-teal-400"
                }`}
                onClick={() => setActiveTool("line")}
                title="Line"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`rounded p-1.5 transition-colors ${
                  activeTool === "eraser" ? "bg-teal-500 text-zinc-950" : "text-slate-500 hover:bg-slate-200 hover:text-teal-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-teal-400"
                }`}
                onClick={() => setActiveTool("eraser")}
                title="Eraser"
              >
                <Eraser className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bottom Section: Dynamic Lists (Scrollable) */}
          <div className="max-h-[250px] overflow-y-auto">
            {contextMenu.step === "category" && (
              <div className="py-1">
                {Object.keys(CLINICAL_TAXONOMY).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className="w-full cursor-pointer px-4 py-1.5 text-left text-xs text-slate-600 transition-colors hover:bg-teal-500/20 hover:text-teal-600 dark:text-zinc-300 dark:hover:text-teal-400"
                    onClick={() =>
                      setContextMenu((prev) =>
                        prev ? { ...prev, step: "spec", tempCategory: cat } : null
                      )
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {contextMenu.step === "spec" && contextMenu.tempCategory && (
              <div className="py-1">
                <button
                  type="button"
                  className="w-full cursor-pointer px-4 py-1.5 text-left text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                  onClick={() =>
                    setContextMenu((prev) =>
                      prev ? { ...prev, step: "category", tempCategory: undefined } : null
                    )
                  }
                >
                  ← Back
                </button>
                {(CLINICAL_TAXONOMY[contextMenu.tempCategory] ?? []).map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    className="w-full cursor-pointer px-4 py-1.5 text-left text-xs text-slate-600 transition-colors hover:bg-teal-500/20 hover:text-teal-600 dark:text-zinc-300 dark:hover:text-teal-400"
                    onClick={() =>
                      setContextMenu((prev) =>
                        prev ? { ...prev, step: "severity", tempSpec: spec } : null
                      )
                    }
                  >
                    {spec}
                  </button>
                ))}
              </div>
            )}
            {contextMenu.step === "severity" && contextMenu.tempCategory && contextMenu.tempSpec && (
              <div className="py-1">
                <button
                  type="button"
                  className="w-full cursor-pointer px-4 py-1.5 text-left text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                  onClick={() =>
                    setContextMenu((prev) =>
                      prev ? { ...prev, step: "spec", tempSpec: undefined } : null
                    )
                  }
                >
                  ← Back
                </button>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="w-full cursor-pointer px-4 py-1.5 text-left text-xs text-slate-600 transition-colors hover:bg-teal-500/20 hover:text-teal-600 dark:text-zinc-300 dark:hover:text-teal-400"
                    onClick={() => {
                      setActiveCategory(contextMenu.tempCategory!);
                      setActiveSpec(contextMenu.tempSpec!);
                      setSeverity(n);
                      setContextMenu(null);
                    }}
                  >
                    Severity {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowTutorial(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowTutorial(false)}
              className="absolute right-4 top-4 rounded p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">
              Skinnfit Clinical Annotation Workflow
            </h2>
            <ol className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
              <li>
                <span className="font-semibold text-slate-900 dark:text-white">1. Upload & Navigate:</span>{" "}
                Click &apos;Upload Images&apos; to load your dataset. Use a two-finger horizontal trackpad swipe to quickly move between images.
              </li>
              <li>
                <span className="font-semibold text-slate-900 dark:text-white">2. Context Menu:</span>{" "}
                To avoid moving your mouse, simply Right-Click anywhere on the face to open the Context Menu.
              </li>
              <li>
                <span className="font-semibold text-slate-900 dark:text-white">3. Select Taxonomy:</span>{" "}
                Drill down through the 8-Engine Taxonomy (Category → Specification → Severity 1–5).
              </li>
              <li>
                <span className="font-semibold text-slate-900 dark:text-white">4. Choose Your Tool:</span>
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>
                    Use the <strong>Path Tool</strong> (Pencil) for distinct areas (Melasma, Erythema, Hair loss). Trace the perimeter to create a translucent shape.
                  </li>
                  <li>
                    Use the <strong>Line Tool</strong> (Minus) for structural mapping (Deep Wrinkles, Crow&apos;s Feet, Jawline sagging).
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-semibold text-slate-900 dark:text-white">5. Erase Mistakes:</span>{" "}
                Select the Eraser Tool from the Context Menu toolbar and click any drawn shape to instantly delete it.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
