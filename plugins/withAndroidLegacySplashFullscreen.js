/**
 * Expo's expo-splash-screen plugin always applies Theme.SplashScreen + windowSplashScreenAnimatedIcon,
 * which on Android 12+ draws the image inside the system splash "icon" mask (rounded square / circle).
 *
 * After prebuild, rewrite Theme.App.SplashScreen to extend AppTheme with android:windowBackground
 * pointing at @drawable/ic_launcher_background (layer-list from expo-splash-screen: full bleed + centered logo).
 *
 * Must be listed BEFORE `expo-splash-screen` in app.json `plugins` so this mod runs after splash and wins.
 */
const { withAndroidStyles } = require('expo/config-plugins');

function normalizeStyleArray(stylesXml) {
  const list = stylesXml?.resources?.style;
  if (!list) return [];
  return Array.isArray(list) ? list : [list];
}

function applyLegacyFullscreenSplash(stylesXml) {
  const stylesArr = normalizeStyleArray(stylesXml);
  const idx = stylesArr.findIndex((s) => s.$?.name === 'Theme.App.SplashScreen');
  if (idx === -1) {
    return stylesXml;
  }

  stylesArr[idx] = {
    $: {
      name: 'Theme.App.SplashScreen',
      parent: 'AppTheme',
    },
    item: [
      {
        $: { name: 'android:windowBackground' },
        _: '@drawable/ic_launcher_background',
      },
    ],
  };

  stylesXml.resources.style = stylesArr.length === 1 ? stylesArr[0] : stylesArr;
  return stylesXml;
}

module.exports = function withAndroidLegacySplashFullscreen(config) {
  return withAndroidStyles(config, (config) => {
    config.modResults = applyLegacyFullscreenSplash(config.modResults);
    return config;
  });
};
