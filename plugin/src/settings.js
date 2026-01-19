const Settings = require("sketch/settings");

const SETTINGS_KEY = "studio.workingon.qrcode.settings";

const DEFAULT_SETTINGS = {
  url: "https://wo.studio",
  color: "#000000",
  size: 150,
  margin: 0,
};

function getSettings() {
  const saved = Settings.settingForKey(SETTINGS_KEY);
  console.log("📖 Loading settings:", saved);
  return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  console.log("💾 Saving settings:", settings);
  Settings.setSettingForKey(SETTINGS_KEY, settings);
}

module.exports = {
  getSettings,
  saveSettings,
  DEFAULT_SETTINGS,
};
