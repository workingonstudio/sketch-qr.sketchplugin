const BrowserWindow = require("sketch-module-web-view");

// Set to true for development (loads from localhost:5173)
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
    width: 400,
    height: 500,
    show: false,
    alwaysOnTop: true,
    titleBarStyle: "hiddenInset",
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

  // Example: Listen for messages from webview
  // browserWindow.webContents.on("someEvent", (data) => {
  //   console.log("Received from webview:", data);
  // });
}
