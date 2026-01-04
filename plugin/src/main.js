const BrowserWindow = require("sketch-module-web-view");

const DEV_MODE = true;

let browserWindow = null;

export function onOpen(context) {
  const sketch = require("sketch/dom");
  const UI = require("sketch/ui");

  const document = sketch.getSelectedDocument();

  if (!document) {
    UI.message("⚠️ No document found. Please open a Sketch document.");
    return;
  }

  // Close existing window if open
  if (browserWindow && !browserWindow.isDestroyed()) {
    browserWindow.close();
  }
  browserWindow = null;

  // Browser window options
  const options = {
    identifier: "studio.workingon.plugin.webview",
    width: 420,
    height: 420,
    show: false,
    alwaysOnTop: true,
    titleBarStyle: "default",
    backgroundColor: "#FFFFFF",
    hasShadow: true,
    acceptsFirstMouse: true,
    resizable: false,
    frame: true,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      devTools: true,
    },
  };

  browserWindow = new BrowserWindow(options);

  // Listen for insertQRCode message from webview
  browserWindow.webContents.on("insertQRCode", (svg, size, margin) => {
    insertQRIntoSketch(context, svg, size, margin);
  });

  // Load URL
  if (DEV_MODE) {
    browserWindow.loadURL("http://localhost:5173");
    console.log("🔥 DEV MODE - Loading from localhost:5173");
  } else {
    const scriptPath = context.scriptPath;
    const pluginPath = scriptPath.split("/Contents/Sketch/")[0];
    const htmlPath = `${pluginPath}/Contents/Resources/ui/dist/index.html`;
    browserWindow.loadURL(`file://${htmlPath}`);
    console.log("📦 PRODUCTION - Loading from:", htmlPath);
  }

  // Show window when ready (prevents flash)
  browserWindow.once("ready-to-show", () => {
    browserWindow.show();
  });

  // Clean up on close
  browserWindow.on("closed", () => {
    browserWindow = null;
  });
}

function insertQRIntoSketch(context, svgString, size, margin) {
  const sketch = require("sketch/dom");
  const UI = require("sketch/ui");

  try {
    const document = sketch.getSelectedDocument();
    const selectedPage = document.selectedPage;

    const wrappedLayer = sketch.createLayerFromData(svgString, "svg");

    if (wrappedLayer && wrappedLayer.layers && wrappedLayer.layers.length > 0) {
      wrappedLayer.name = "QR Code";

      console.log(
        "Imported QR dimensions:",
        wrappedLayer.frame.width,
        "x",
        wrappedLayer.frame.height
      );

      selectedPage.layers.push(wrappedLayer);

      UI.message(
        `✓ QR Code inserted (${size}x${size}px with ${margin}px margin)`
      );
    } else {
      UI.message("✗ SVG imported but contains no layers");
    }
  } catch (error) {
    console.error("Error inserting QR code:", error);
    UI.message(`✗ Failed: ${error.message}`);
  }
}
