export function showAbout(context) {
  // Get the path to the plugin's resources
  const scriptPath = context.scriptPath;
  const pluginPath = scriptPath.split("/Contents/Sketch/")[0];
  const iconPath = `${pluginPath}/Contents/Resources/icon.png`;

  // Create native macOS alert
  const alert = NSAlert.alloc().init();
  alert.setMessageText("QR Code Generator");
  alert.setInformativeText(
    "Version 1.0.0\n\nQR Code Generator for Sketch\n\nCreated by workingon.studio"
  );
  alert.addButtonWithTitle("OK");
  alert.addButtonWithTitle("Github");

  // Load and set custom icon
  const image = NSImage.alloc().initWithContentsOfFile(iconPath);
  if (image) {
    alert.setIcon(image);
  }

  const response = alert.runModal();

  // NSAlertSecondButtonReturn = 1001
  if (response === 1001) {
    const workspace = NSWorkspace.sharedWorkspace();
    const url = NSURL.URLWithString(
      "https://github.com/workingonstudio/sketch-qr.sketchplugin"
    );
    workspace.openURL(url);
  }
}
