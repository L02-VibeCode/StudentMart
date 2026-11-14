const assert = require('node:assert/strict');
const required = ['EXPO_OWNER', 'EAS_PROJECT_ID', 'ANDROID_APPLICATION_ID', 'IOS_BUNDLE_IDENTIFIER', 'EXPO_PUBLIC_API_URL'];
for (const key of required) assert.ok(process.env[key]?.trim(), `Configure production-mobile variable ${key}`);
assert.match(process.env.EAS_PROJECT_ID, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Use an initialized EAS project ID');
for (const key of ['ANDROID_APPLICATION_ID', 'IOS_BUNDLE_IDENTIFIER']) {
  assert.match(process.env[key], /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/, `Invalid ${key}`);
}
const url = new URL(process.env.EXPO_PUBLIC_API_URL);
assert.ok(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/', 'API must be an HTTPS origin');
assert.ok(!/^(localhost|127\.|10\.|192\.168\.)/i.test(url.hostname) && !url.hostname.endsWith('.invalid'), 'Configure a public production API, not a test origin');
console.log('Production EAS metadata present; credentials/signing must already be provisioned');
if (process.argv.includes('--prepare')) {
  const fs = require('node:fs');
  const path = require('node:path');
  const file = path.resolve(__dirname, '../../mobile/eas.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  // Forward public metadata into the remote build as well; never forward EXPO_TOKEN/secrets.
  config.build.production.env = Object.fromEntries(required.map(key => [key, process.env[key]]));
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
  console.log('Public production metadata prepared for the remote EAS build');
}
