const SettingsRepository = require("./settings.repository");

function toSettingsDTO(doc) {
  if (!doc) return null;
  const { id, supportEmail, allowedRegions } = doc;
  return {
    id,
    supportEmail,
    allowedRegions: allowedRegions || [],
  };
}

async function getGlobalSettings() {
  const doc = await SettingsRepository.getGlobal();
  return toSettingsDTO(doc);
}

module.exports = {
  getGlobalSettings,
};
