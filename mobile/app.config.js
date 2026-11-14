// Public build metadata only. Native IDs/project ownership must be supplied by the owner.
module.exports = ({ config }) => ({
  ...config,
  ...(process.env.EXPO_OWNER ? { owner: process.env.EXPO_OWNER } : {}),
  ...(process.env.EAS_PROJECT_ID ? { extra: { ...config.extra, eas: { projectId: process.env.EAS_PROJECT_ID } } } : {}),
  ...(process.env.ANDROID_APPLICATION_ID ? { android: { ...config.android, package: process.env.ANDROID_APPLICATION_ID } } : {}),
  ...(process.env.IOS_BUNDLE_IDENTIFIER ? { ios: { ...config.ios, bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER } } : {}),
});
