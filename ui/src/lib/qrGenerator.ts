import QRCodeStyling from "qr-code-styling";

export interface QROptions {
  url: string;
  color: string;
  size: number;
  margin: number;
}

/**
 * Generate a QR code for preview (no margin, fixed size)
 */
export function createPreviewQR(
  url: string,
  color: string,
  size: number
): QRCodeStyling {
  return new QRCodeStyling({
    width: size,
    height: size,
    data: url,
    margin: 0,
    type: "svg",
    dotsOptions: {
      color: color,
      type: "square",
    },
    cornersSquareOptions: {
      color: color,
      type: "square",
    },
    cornersDotOptions: {
      color: color,
      type: "square",
    },
  });
}

/**
 * Generate a QR code SVG string ready for Sketch insertion
 * This handles all the complex scaling and margin positioning
 */
export async function generateQRForSketch(options: QROptions): Promise<string> {
  const { url, color, size, margin } = options;

  const tempContainer = document.createElement("div");
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  document.body.appendChild(tempContainer);

  try {
    // Generate at a larger size for better quality, margin 0
    const generateSize = 300;
    const qrCode = new QRCodeStyling({
      width: generateSize,
      height: generateSize,
      data: url,
      margin: 0,
      type: "svg",
      dotsOptions: {
        color: color,
        type: "square",
      },
      cornersSquareOptions: {
        color: color,
        type: "square",
      },
      cornersDotOptions: {
        color: color,
        type: "square",
      },
      backgroundOptions: {
        color: "transparent",
      },
    });

    qrCode.append(tempContainer);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const svgElement = tempContainer.querySelector("svg");
    if (!svgElement) {
      throw new Error("Failed to generate SVG");
    }

    const dotClipPath = svgElement.querySelector('clipPath[id*="dot-color"]');
    const cornerSquarePaths = svgElement.querySelectorAll(
      'clipPath[id*="corners-square"]'
    );
    const cornerDotPaths = svgElement.querySelectorAll(
      'clipPath[id*="corners-dot"]'
    );

    // Measure actual QR pattern bounds
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    if (dotClipPath) {
      const allRects = dotClipPath.querySelectorAll("rect");
      allRects.forEach((rect) => {
        const x = parseFloat(rect.getAttribute("x") || "0");
        const y = parseFloat(rect.getAttribute("y") || "0");
        const w = parseFloat(rect.getAttribute("width") || "0");
        const h = parseFloat(rect.getAttribute("height") || "0");
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      });
    }

    // Also check corner squares for bounds
    cornerSquarePaths.forEach((clipPath) => {
      const path = clipPath.querySelector("path");
      if (path) {
        const d = path.getAttribute("d") || "";
        const matches = d.matchAll(/M\s*([\d.]+)\s+([\d.]+)/g);
        for (const match of matches) {
          const x = parseFloat(match[1]);
          const y = parseFloat(match[2]);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + 28); // Corner squares are ~28px
          maxY = Math.max(maxY, y + 28);
        }
      }
    });

    const qrWidth = maxX - minX;
    const qrHeight = maxY - minY;

    // Calculate how to fit QR into target size with margin
    const targetSize = size - margin * 2;
    const scale = targetSize / Math.max(qrWidth, qrHeight);

    // Calculate offset to center and add margin
    const scaledWidth = qrWidth * scale;
    const scaledHeight = qrHeight * scale;
    const offsetX = margin + (targetSize - scaledWidth) / 2 - minX * scale;
    const offsetY = margin + (targetSize - scaledHeight) / 2 - minY * scale;

    const defs = svgElement.querySelector("defs");
    const clippedRects = svgElement.querySelectorAll("rect[clip-path]");
    clippedRects.forEach((rect) => rect.remove());
    if (defs) defs.remove();

    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }

    // Add dots with scale and offset
    if (dotClipPath) {
      const dotRects = dotClipPath.querySelectorAll("rect");
      dotRects.forEach((rect) => {
        const newRect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        const x = parseFloat(rect.getAttribute("x") || "0") * scale + offsetX;
        const y = parseFloat(rect.getAttribute("y") || "0") * scale + offsetY;
        const w = parseFloat(rect.getAttribute("width") || "0") * scale;
        const h = parseFloat(rect.getAttribute("height") || "0") * scale;

        newRect.setAttribute("x", x.toString());
        newRect.setAttribute("y", y.toString());
        newRect.setAttribute("width", w.toString());
        newRect.setAttribute("height", h.toString());
        newRect.setAttribute("fill", color);
        svgElement.appendChild(newRect);
      });
    }

    // Add corner squares with transform
    cornerSquarePaths.forEach((clipPath) => {
      const path = clipPath.querySelector("path");
      if (path) {
        const newPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        newPath.setAttribute("d", path.getAttribute("d") || "");
        newPath.setAttribute("fill", color);
        newPath.setAttribute("fill-rule", "evenodd");
        newPath.setAttribute(
          "transform",
          `translate(${offsetX},${offsetY}) scale(${scale})`
        );
        svgElement.appendChild(newPath);
      }
    });

    // Add corner dots with scale and offset
    cornerDotPaths.forEach((clipPath) => {
      const rect = clipPath.querySelector("rect");
      if (rect) {
        const newRect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        const x = parseFloat(rect.getAttribute("x") || "0") * scale + offsetX;
        const y = parseFloat(rect.getAttribute("y") || "0") * scale + offsetY;
        const w = parseFloat(rect.getAttribute("width") || "0") * scale;
        const h = parseFloat(rect.getAttribute("height") || "0") * scale;

        newRect.setAttribute("x", x.toString());
        newRect.setAttribute("y", y.toString());
        newRect.setAttribute("width", w.toString());
        newRect.setAttribute("height", h.toString());
        newRect.setAttribute("fill", color);
        svgElement.appendChild(newRect);
      }
    });

    // Set final SVG size
    svgElement.setAttribute("width", size.toString());
    svgElement.setAttribute("height", size.toString());
    svgElement.setAttribute("viewBox", `0 0 ${size} ${size}`);

    let svgText = new XMLSerializer().serializeToString(svgElement);

    // Clean namespace stuff
    svgText = svgText
      .replace(/<\?xml[^?]*\?>\s*/g, "")
      .replace(/xmlns:xlink="[^"]*"/g, "")
      .replace(/xlink:/g, "");

    return svgText;
  } finally {
    document.body.removeChild(tempContainer);
  }
}
