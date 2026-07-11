#!/usr/bin/env node
/**
 * Keeps native iOS/Android version fields aligned with app.json (Expo).
 *
 * Source of truth:
 *   - expo.version              → iOS MARKETING_VERSION, Android versionName
 *   - expo.ios.buildNumber      → iOS CURRENT_PROJECT_VERSION (CFBundleVersion)
 *   - expo.android.versionCode  → Android versionCode (falls back to numeric ios.buildNumber)
 *
 * Run before local archive or EAS: pnpm run sync-native-versions
 */

const fs = require("fs");
const path = require("path");

/** Repo root — script is invoked via pnpm run sync-native-versions / EAS from project root. */
const root = process.cwd();
const appJsonPath = path.join(root, "app.json");
const pbxPath = path.join(root, "ios/stepra.xcodeproj/project.pbxproj");
const gradlePath = path.join(root, "android/app/build.gradle");

function readApp() {
  const raw = fs.readFileSync(appJsonPath, "utf8");
  const { expo } = JSON.parse(raw);
  if (!expo?.version) {
    console.error("sync-native-versions: missing expo.version in app.json");
    process.exit(1);
  }
  const marketing = String(expo.version).trim();
  const iosBuildRaw = expo.ios?.buildNumber;
  if (iosBuildRaw == null || String(iosBuildRaw).trim() === "") {
    console.error(
      "sync-native-versions: set expo.ios.buildNumber in app.json (store build number; bump each App Store submission).",
    );
    process.exit(1);
  }
  const iosBuild = String(iosBuildRaw).trim();

  let versionCode =
    expo.android?.versionCode != null
      ? Number(expo.android.versionCode)
      : Number.parseInt(iosBuild, 10);

  if (!Number.isFinite(versionCode) || versionCode < 1) {
    console.error(
      "sync-native-versions: expo.android.versionCode must be a positive integer, or expo.ios.buildNumber must parse as one.",
    );
    process.exit(1);
  }

  return { marketing, iosBuild, versionCode };
}

function syncIos({ marketing, iosBuild }) {
  if (!fs.existsSync(pbxPath)) {
    console.warn("sync-native-versions: skip iOS —", pbxPath, "not found");
    return;
  }
  let pbx = fs.readFileSync(pbxPath, "utf8");

  const beforeM = (pbx.match(/\n\s*MARKETING_VERSION = [^;\n]+;/g) ?? []).join("\n");
  const beforeC = (pbx.match(/\n\s*CURRENT_PROJECT_VERSION = [^;\n]+;/g) ?? []).join("\n");

  if (!beforeM) {
    console.error("sync-native-versions: MARKETING_VERSION not found in project.pbxproj");
    process.exit(1);
  }
  if (!beforeC) {
    console.error("sync-native-versions: CURRENT_PROJECT_VERSION not found in project.pbxproj");
    process.exit(1);
  }

  // MARKETING_VERSION may be quoted or unquoted in some projects — normalize to Expo style (unquoted, dots ok)
  pbx = pbx.replace(/^(\t\t\t\tMARKETING_VERSION = )[^;\n]+;/gm, `$1${marketing};`);
  // Build number: integer segments only in pbx (e.g. 2 or 42); string build like "1.2.3" → Xcode accepts CURRENT_PROJECT_VERSION = 123 style — use iosBuild literally if alphanumeric
  pbx = pbx.replace(/^(\t\t\t\tCURRENT_PROJECT_VERSION = )[^;\n]+;/gm, `$1${iosBuild};`);

  fs.writeFileSync(pbxPath, pbx);
}

function syncAndroid({ marketing, versionCode }) {
  if (!fs.existsSync(gradlePath)) {
    console.warn("sync-native-versions: skip Android —", gradlePath, "not found");
    return;
  }
  let gradle = fs.readFileSync(gradlePath, "utf8");

  if (!/versionCode \d+/m.test(gradle)) {
    console.error("sync-native-versions: versionCode not found in android/app/build.gradle");
    process.exit(1);
  }
  if (!/versionName\s+"[^"]*"/m.test(gradle)) {
    console.error("sync-native-versions: versionName not found in android/app/build.gradle");
    process.exit(1);
  }

  gradle = gradle.replace(/versionCode \d+/m, `versionCode ${versionCode}`);
  gradle = gradle.replace(
    /versionName\s+"[^"]*"/m,
    `versionName "${marketing.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
  );

  fs.writeFileSync(gradlePath, gradle);
}

const cfg = readApp();
syncIos(cfg);
syncAndroid(cfg);

console.log(
  `sync-native-versions: expo.version=${cfg.marketing}, ios.buildNumber=${cfg.iosBuild}, android.versionCode=${cfg.versionCode}`,
);