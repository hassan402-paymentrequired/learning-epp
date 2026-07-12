#!/usr/bin/env node
/**
 * Keeps native iOS/Android version fields aligned with app.json (Expo).
 *
 * Source of truth (local bare / prebuild folders only):
 *   - expo.version              → iOS MARKETING_VERSION, Android versionName
 *   - expo.ios.buildNumber      → iOS CURRENT_PROJECT_VERSION
 *   - expo.android.versionCode  → Android versionCode (falls back to ios.buildNumber)
 *
 * NOTE: If you use EAS Build with eas.json:
 *   "cli.appVersionSource": "remote" + production.autoIncrement: true
 * then EAS stores/increments the store build number on Expo's servers.
 * This script will no-op when ios/ and android/ are not in the repo (managed workflow).
 * Bump expo.version in app.json when you want a new user-facing version (e.g. 1.0.1 → 1.0.2).
 *
 * Usage:
 *   npm run sync-native-versions
 *   npm run sync-native-versions -- --bump   # increments ios.buildNumber (+ android.versionCode) in app.json
 */

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const appJsonPath = path.join(root, "app.json");
const pbxPath = path.join(root, "ios/stepra.xcodeproj/project.pbxproj");
const gradlePath = path.join(root, "android/app/build.gradle");
const shouldBump = process.argv.includes("--bump");

function readAppJson() {
  const raw = fs.readFileSync(appJsonPath, "utf8");
  return JSON.parse(raw);
}

function bumpAppJson(app) {
  const expo = app.expo;
  const current = Number.parseInt(String(expo.ios?.buildNumber ?? "0"), 10);
  const next = (Number.isFinite(current) ? current : 0) + 1;
  expo.ios = expo.ios || {};
  expo.ios.buildNumber = String(next);

  const androidCode =
    expo.android?.versionCode != null
      ? Number(expo.android.versionCode)
      : current;
  expo.android = expo.android || {};
  expo.android.versionCode =
    (Number.isFinite(androidCode) ? androidCode : 0) + 1;

  fs.writeFileSync(appJsonPath, `${JSON.stringify(app, null, 2)}\n`);
  console.log(
    `sync-native-versions: bumped app.json → ios.buildNumber=${expo.ios.buildNumber}, android.versionCode=${expo.android.versionCode}`,
  );
  return app;
}

function readApp(app) {
  const { expo } = app;
  if (!expo?.version) {
    console.error("sync-native-versions: missing expo.version in app.json");
    process.exit(1);
  }
  const marketing = String(expo.version).trim();
  const iosBuildRaw = expo.ios?.buildNumber;
  if (iosBuildRaw == null || String(iosBuildRaw).trim() === "") {
    console.error(
      "sync-native-versions: set expo.ios.buildNumber in app.json (or pass --bump).",
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
    return false;
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

  pbx = pbx.replace(/^(\t\t\t\tMARKETING_VERSION = )[^;\n]+;/gm, `$1${marketing};`);
  pbx = pbx.replace(/^(\t\t\t\tCURRENT_PROJECT_VERSION = )[^;\n]+;/gm, `$1${iosBuild};`);

  fs.writeFileSync(pbxPath, pbx);
  return true;
}

function syncAndroid({ marketing, versionCode }) {
  if (!fs.existsSync(gradlePath)) {
    return false;
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
  return true;
}

let app = readAppJson();
if (shouldBump) {
  app = bumpAppJson(app);
}

const cfg = readApp(app);
const syncedIos = syncIos(cfg);
const syncedAndroid = syncAndroid(cfg);

if (!syncedIos && !syncedAndroid) {
  console.log(
    "sync-native-versions: no ios/ or android/ folders (EAS managed workflow).",
  );
  console.log(
    "  → Store build number is managed by EAS (eas.json appVersionSource: remote + autoIncrement).",
  );
  console.log(
    "  → User-facing version comes from app.json expo.version (currently " +
      cfg.marketing +
      ").",
  );
  console.log(
    "  → Tip: bump expo.version before a release; EAS auto-increments CFBundleVersion remotely.",
  );
} else {
  if (syncedIos) console.log("sync-native-versions: updated ios project.pbxproj");
  if (syncedAndroid) console.log("sync-native-versions: updated android/app/build.gradle");
}

console.log(
  `sync-native-versions: expo.version=${cfg.marketing}, ios.buildNumber=${cfg.iosBuild}, android.versionCode=${cfg.versionCode}`,
);
