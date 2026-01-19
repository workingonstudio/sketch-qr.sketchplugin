const BrowserWindow = require("sketch-module-web-view");
const { showAbout } = require("./about.js");

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

  let isDark = false;
  try {
    // Access Sketch's NSApp directly
    const appearance = NSApp.effectiveAppearance();
    const appearanceName = String(appearance.name());

    console.log("🎨 Sketch Appearance:", appearanceName);

    isDark = appearanceName.toLowerCase().includes("dark");

    console.log("🎨 isDark:", isDark);
    console.log("🎨 Setting background to:", isDark ? "#18181b" : "#FFFFFF");
  } catch (e) {
    console.log("❌ Could not detect Sketch appearance:", e);
    console.log("🎨 Defaulting to light mode");
  }

  // Browser window options
  const options = {
    identifier: "studio.workingon.plugin.webview",
    width: 420,
    height: 420,
    show: false,
    alwaysOnTop: true,
    titleBarStyle: "default",
    backgroundColor: isDark ? "#18181b" : "#FFFFFF",
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
  browserWindow.webContents.on("insertQRCode", (svg, size, margin, url) => {
    insertQRIntoSketch(context, svg, size, margin, url);
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

export function onAbout(context) {
  showAbout(context);
}

function insertQRIntoSketch(context, svgString, size, margin, url) {
  const sketch = require("sketch/dom");
  const UI = require("sketch/ui");

  try {
    const document = sketch.getSelectedDocument();
    const selectedPage = document.selectedPage;
    const selection = document.selectedLayers;

    const wrappedLayer = sketch.createLayerFromData(svgString, "svg");

    if (wrappedLayer && wrappedLayer.layers && wrappedLayer.layers.length > 0) {
      wrappedLayer.name = `QR - ${url}`;

      console.log(
        "Imported QR dimensions:",
        wrappedLayer.frame.width,
        "x",
        wrappedLayer.frame.height,
      );

      // Insert based on selection
      if (selection.length > 0) {
        const selectedLayer = selection.layers[0];

        // Insert into the selected layer at 0,0
        selectedLayer.layers.push(wrappedLayer);
        wrappedLayer.frame.x = 0;
        wrappedLayer.frame.y = 0;

        UI.message(
          `✓ QR Code inserted into ${selectedLayer.name} (${size}x${size}px with ${margin}px margin)`,
        );
      } else {
        // No selection - insert on page
        selectedPage.layers.push(wrappedLayer);
        wrappedLayer.frame.x = 0;
        wrappedLayer.frame.y = 0;

        UI.message(
          `✓ QR Code inserted (${size}x${size}px with ${margin}px margin)`,
        );
      }
    } else {
      UI.message("✗ SVG imported but contains no layers");
    }
  } catch (error) {
    console.error("Error inserting QR code:", error);
    UI.message(`✗ Failed: ${error.message}`);
  }
}
