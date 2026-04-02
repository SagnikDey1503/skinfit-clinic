/**
 * Renders a DOM node to a multi-page A4 PDF (client-only).
 */
export async function downloadScanReportPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Ensure images inside the report load before rendering.
  // We cap the wait time to avoid browser auto-download blocking.
  const imgs = Array.from(element.querySelectorAll("img"));
  const waitForImages = Promise.allSettled(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })
  );
  const timeoutMs = 2500;
  await Promise.race([
    waitForImages,
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);

  // Small delay to allow layout/paint after image load.
  await new Promise((r) => setTimeout(r, 250));

  // Use html2canvas-pro directly (not html2pdf.js), so color functions like
  // oklab()/lab()/lch() render correctly for the PDF.
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    // Allow tainted images so cross-origin images still render into the canvas.
    // html2canvas-pro is used to properly handle oklab/lab/lch color functions.
    allowTaint: true,
    foreignObjectRendering: false,
    logging: false,
    backgroundColor: "#F5F1E9",
  });

  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });

  const marginMm = 8;
  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const usableWidthMm = pageWidthMm - marginMm * 2;
  const usableHeightMm = pageHeightMm - marginMm * 2;

  // Crop the big canvas into A4 chunks (same approach as html2pdf.js).
  const pxFullHeight = canvas.height;
  const pxPageHeight = Math.round(
    (canvas.width * usableHeightMm) / usableWidthMm
  );
  const nPages = Math.ceil(pxFullHeight / pxPageHeight);

  for (let page = 0; page < nPages; page++) {
    const pageCanvas = document.createElement("canvas");
    const pageHeightPx = Math.min(pxPageHeight, pxFullHeight - page * pxPageHeight);
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageHeightPx;

    const ctx = pageCanvas.getContext("2d");
    if (!ctx) throw new Error("PDF generation failed: no 2D context");

    ctx.drawImage(
      canvas,
      0,
      page * pxPageHeight,
      canvas.width,
      pageHeightPx,
      0,
      0,
      canvas.width,
      pageHeightPx
    );

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);
    // Convert px height -> mm height using the same scaling factor as width.
    const pageHeightMmActualUnclamped =
      (pageHeightPx * usableWidthMm) / canvas.width;
    const pageHeightMmActual = Math.min(
      usableHeightMm,
      pageHeightMmActualUnclamped
    );

    if (page > 0) pdf.addPage();
    pdf.addImage(
      imgData,
      "JPEG",
      marginMm,
      marginMm,
      usableWidthMm,
      pageHeightMmActual
    );
  }

  pdf.save(filename);
}
