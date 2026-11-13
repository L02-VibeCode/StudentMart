const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const YAML = require('yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const contractDirectory = path.resolve(__dirname, '../../docs/contracts');
const document = YAML.parse(fs.readFileSync(path.join(contractDirectory, 'accounts.openapi.yaml'), 'utf8'));
const examples = JSON.parse(fs.readFileSync(path.join(contractDirectory, 'examples.json'), 'utf8'));
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(document, 'account-contract');

function validates(name, schema, input, expected = true) {
  test(name, () => {
    const validate = ajv.getSchema(`account-contract#/components/schemas/${schema}`);
    assert.ok(validate, `Missing schema ${schema}`);
    assert.equal(validate(input), expected, JSON.stringify(validate.errors));
  });
}

validates('registration fixture', 'RegisterRequest', examples.register);
validates('login fixture', 'LoginRequest', examples.login);
validates('profile update fixture', 'UpdateProfileRequest', examples.updateProfile);
validates('private profile fixture', 'PrivateAccount', examples.privateAccount);
validates('public profile fixture', 'PublicAccount', examples.publicAccount);
validates('error fixture', 'ErrorEnvelope', examples.validationError);
validates('registration response without a session', 'AccountResponse', { account: examples.privateAccount });
validates('login response with a session', 'LoginResponse', { account: examples.privateAccount, session: examples.session });

for (const field of ['role', 'schoolVerification', 'accountId', 'confirmPassword']) {
  validates(`registration rejects ${field}`, 'RegisterRequest', { ...examples.register, [field]: 'injected' }, false);
}
for (const field of ['role', 'email', 'schoolVerification', 'accountId', 'avatarUrl']) {
  validates(`profile update rejects ${field}`, 'UpdateProfileRequest', { [field]: 'injected' }, false);
}
for (const field of ['email', 'role', 'area', 'createdAt', 'updatedAt', 'password', 'passwordHash', 'token', 'session', 'schoolEmail', 'address']) {
  validates(`public profile rejects ${field}`, 'PublicAccount', { ...examples.publicAccount, [field]: 'private' }, false);
}

validates('short password rejected', 'RegisterRequest', { ...examples.register, password: 'short' }, false);
validates('malformed email rejected', 'RegisterRequest', { ...examples.register, email: 'invalid' }, false);
validates('blank name rejected', 'RegisterRequest', { ...examples.register, displayName: '   ' }, false);
validates('null name rejected', 'UpdateProfileRequest', { displayName: null }, false);
validates('empty patch rejected', 'UpdateProfileRequest', {}, false);
validates('null clears optional fields', 'UpdateProfileRequest', { bio: null, areaId: null, declaredSchoolId: null });
validates('long biography rejected', 'UpdateProfileRequest', { bio: 'x'.repeat(501) }, false);
validates('malformed lookup id rejected', 'UpdateProfileRequest', { areaId: 'not-a-uuid' }, false);
validates('unicode name uses code points', 'RegisterRequest', { ...examples.register, displayName: '\u{1F600}'.repeat(100) });
validates('unicode name over limit rejected', 'RegisterRequest', { ...examples.register, displayName: '\u{1F600}'.repeat(101) }, false);
validates('short token rejected', 'LoginResponse', { account: examples.privateAccount, session: { ...examples.session, token: 'short' } }, false);
validates('malformed session date rejected', 'LoginResponse', { account: examples.privateAccount, session: { ...examples.session, expiresAt: 'invalid' } }, false);
validates('registration cannot return session', 'AccountResponse', { account: examples.privateAccount, session: examples.session }, false);
validates('error cannot expose stack trace', 'ErrorEnvelope', { error: { ...examples.validationError.error, stack: 'private' } }, false);
validates('error requires correlation id', 'ErrorEnvelope', { error: { code: 'VALIDATION_ERROR', message: 'Invalid' } }, false);
validates('public verification excludes timestamp', 'PublicAccount', { ...examples.publicAccount, schoolVerification: examples.privateAccount.schoolVerification }, false);

const school = { id: examples.privateAccount.id, name: 'Synthetic school fixture' };
const timestamp = examples.privateAccount.createdAt;
validates('private unverified state', 'PrivateSchoolVerification', { status: 'UNVERIFIED', school: null, verifiedAt: null });
validates('private verified state', 'PrivateSchoolVerification', { status: 'VERIFIED', school, verifiedAt: timestamp });
validates('verified requires school', 'PrivateSchoolVerification', { status: 'VERIFIED', school: null, verifiedAt: timestamp }, false);
validates('verified requires timestamp', 'PrivateSchoolVerification', { status: 'VERIFIED', school, verifiedAt: null }, false);
validates('unverified cannot carry school', 'PrivateSchoolVerification', { status: 'UNVERIFIED', school, verifiedAt: null }, false);
validates('public verified state', 'PublicSchoolVerification', { status: 'VERIFIED', school });
validates('public verified requires school', 'PublicSchoolVerification', { status: 'VERIFIED', school: null }, false);
validates('public unverified cannot carry school', 'PublicSchoolVerification', { status: 'UNVERIFIED', school }, false);

test('operation ids are unique and security is explicit', () => {
  const publicOperations = new Set(['registerAccount', 'loginAccount', 'getPublicAccount', 'listSchools', 'listAreas']);
  const operationIds = [];
  assert.deepEqual(document.security, [{ bearerSession: [] }]);
  for (const methods of Object.values(document.paths)) {
    for (const operation of Object.values(methods)) {
      operationIds.push(operation.operationId);
      if (publicOperations.has(operation.operationId)) assert.deepEqual(operation.security, []);
      else assert.equal(operation.security, undefined);
    }
  }
  assert.equal(operationIds.length, 10);
  assert.equal(new Set(operationIds).size, 10);
});

test('private projections explicitly disable HTTP caching', () => {
  const accountResponse = document.components.responses.PrivateAccount;
  assert.equal(accountResponse.headers['Cache-Control'].$ref, '#/components/headers/NoStore');
  assert.equal(document.paths['/auth/login'].post.responses['200'].headers['Cache-Control'].$ref, '#/components/headers/NoStore');
  assert.deepEqual(document.components.headers.NoStore.schema.enum, ['no-store']);
});
