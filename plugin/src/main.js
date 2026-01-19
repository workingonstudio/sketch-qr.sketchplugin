const BrowserWindow = require("sketch-module-web-view");
const { showAbout } = require("./about.js");
const Settings = require("sketch/settings");

const DEV_MODE = false;

let browserWindow = null;

// Settings management
const SETTINGS_KEY = "studio.workingon.qrcode.settings";

const DEFAULT_SETTINGS = {
  url: "https://wo.studio",
  color: "#000000",
  size: 150,
  margin: 0,
};

function getSettings() {
  const saved = Settings.settingForKey(SETTINGS_KEY);
  return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  Settings.setSettingForKey(SETTINGS_KEY, settings);
}

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
    const appearance = NSApp.effectiveAppearance();
    const appearanceName = String(appearance.name());

    isDark = appearanceName.toLowerCase().includes("dark");
  } catch (e) {
    console.log("❌ Could not detect Sketch appearance:", e);
  }

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

  // Listen for settings updates from webview
  browserWindow.webContents.on("saveSettings", (settings) => {
    saveSettings(settings);
  });

  // Listen for insertQRCode message from webview
  browserWindow.webContents.on("insertQRCode", (svg, size, margin, url) => {
    insertQRIntoSketch(context, svg, size, margin, url);
  });

  // Inject settings when webview is ready
  browserWindow.webContents.on("did-finish-load", () => {
    const savedSettings = getSettings();
    browserWindow.webContents.executeJavaScript(
      `window.initialSettings = ${JSON.stringify(savedSettings)};`,
    );
  });

  // Load URL
  if (DEV_MODE) {
    browserWindow.loadURL("http://localhost:5173");
  } else {
    const scriptPath = context.scriptPath;
    const pluginPath = scriptPath.split("/Contents/Sketch/")[0];
    const htmlPath = `${pluginPath}/Contents/Resources/ui/dist/index.html`;
    browserWindow.loadURL(`file://${htmlPath}`);
  }

  browserWindow.once("ready-to-show", () => {
    browserWindow.show();
  });

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

      if (selection.length > 0) {
        const selectedLayer = selection.layers[0];

        selectedLayer.layers.push(wrappedLayer);
        wrappedLayer.frame.x = 0;
        wrappedLayer.frame.y = 0;

        UI.message(
          `✓ QR Code inserted into ${selectedLayer.name} (${size}x${size}px with ${margin}px margin)`,
        );
      } else {
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
