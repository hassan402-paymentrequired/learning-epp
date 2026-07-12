#!/usr/bin/env node
/**
 * Metro can fail resolving hoisted peer deps nested under expo-notifications.
 * Ensure local symlinks exist after install.
 */
const fs = require('fs');
const path = require('path');

const nestedDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'node_modules'
);

const links = ['expo-constants', 'expo-application'];

if (!fs.existsSync(path.join(__dirname, '..', 'node_modules', 'expo-notifications'))) {
  process.exit(0);
}

fs.mkdirSync(nestedDir, { recursive: true });

for (const pkg of links) {
  const target = path.join(nestedDir, '..', '..', pkg);
  const linkPath = path.join(nestedDir, pkg);

  if (!fs.existsSync(target)) {
    continue;
  }

  try {
    if (fs.existsSync(linkPath) || fs.lstatSync(linkPath).isSymbolicLink()) {
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  } catch {
    // linkPath may not exist
  }

  fs.symlinkSync(path.join('..', '..', pkg), linkPath, 'dir');
}
