import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAccountNote,
  getSession,
  login,
  logout,
  register,
  setAccountNote,
  type StorageLike,
} from '../src/features/auth/authStore';

class MemoryStorage implements StorageLike {
  private store = new Map<string, string>();

  async getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  async removeItem(key: string) {
    this.store.delete(key);
  }
}

test('register creates a session', async () => {
  const storage = new MemoryStorage();

  const session = await register(storage, 'a@studentmart.vn', 'secret');

  assert.equal(session.email, 'a@studentmart.vn');
  assert.ok(session.token.includes('a@studentmart.vn'));
  assert.deepEqual(await getSession(storage), session);
});

test('login fails with wrong password', async () => {
  const storage = new MemoryStorage();
  await register(storage, 'a@studentmart.vn', 'secret');

  await assert.rejects(() => login(storage, 'a@studentmart.vn', 'wrong-pass'), {
    message: 'Sai tài khoản hoặc mật khẩu.',
  });
});

test('logout clears current session', async () => {
  const storage = new MemoryStorage();
  await register(storage, 'a@studentmart.vn', 'secret');

  await logout(storage);

  assert.equal(await getSession(storage), null);
});

test('account note stays isolated per account', async () => {
  const storage = new MemoryStorage();
  await register(storage, 'alice@studentmart.vn', 'secret1');
  await setAccountNote(storage, 'alice@studentmart.vn', 'alice note');
  await logout(storage);

  await register(storage, 'bob@studentmart.vn', 'secret2');
  const bobNote = await getAccountNote(storage, 'bob@studentmart.vn');
  const aliceNote = await getAccountNote(storage, 'alice@studentmart.vn');

  assert.equal(bobNote, null);
  assert.equal(aliceNote, 'alice note');
});
