const appJson = require("./app.json");

const LOCAL_API_HOSTS = ["localhost", "127.0.0.1", "10.0.2.2", "0.0.0.0"];

function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";
}

function isProductionStoreBuild() {
  const profile = process.env.EAS_BUILD_PROFILE;
  return process.env.EAS_BUILD === "true" && profile === "production";
}

function validateProductionApiBaseUrl(apiBaseUrl) {
  if (!isProductionStoreBuild()) {
    return;
  }

  if (!apiBaseUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is required for production mobile builds.",
    );
  }

  let parsed;
  try {
    parsed = new URL(apiBaseUrl);
  } catch {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error(
      "Production mobile builds must use an HTTPS EXPO_PUBLIC_API_BASE_URL.",
    );
  }

  if (LOCAL_API_HOSTS.includes(parsed.hostname)) {
    throw new Error(
      "Production mobile builds cannot use a local/emulator API host.",
    );
  }
}

module.exports = ({ config }) => {
  const apiBaseUrl = getApiBaseUrl();
  validateProductionApiBaseUrl(apiBaseUrl);
  const baseConfig = {
    ...appJson.expo,
    ...config,
  };

  return {
    ...baseConfig,
    extra: {
      ...baseConfig.extra,
      apiBaseUrlConfigured: Boolean(apiBaseUrl),
      appVariant:
        process.env.APP_VARIANT ?? process.env.EAS_BUILD_PROFILE ?? "development",
    },
  };
};
