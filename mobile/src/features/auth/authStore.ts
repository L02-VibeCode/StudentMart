export type AuthSession = {
  email: string;
  token: string;
};

export type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

type UserRecord = {
  email: string;
  password: string;
};

const USERS_KEY = 'auth:users';
const SESSION_KEY = 'auth:session';
const ACCOUNT_NOTE_PREFIX = 'auth:note:';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function readUsers(storage: StorageLike): Promise<UserRecord[]> {
  const raw = await storage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as UserRecord[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeUsers(storage: StorageLike, users: UserRecord[]) {
  await storage.setItem(USERS_KEY, JSON.stringify(users));
}

function buildToken(email: string) {
  return `${normalizeEmail(email)}-${Date.now().toString(36)}`;
}

export async function register(storage: StorageLike, email: string, password: string): Promise<AuthSession> {
  const normalizedEmail = normalizeEmail(email);
  const users = await readUsers(storage);
  const existed = users.find((user) => user.email === normalizedEmail);

  if (existed) {
    throw new Error('Tài khoản đã tồn tại.');
  }

  users.push({
    email: normalizedEmail,
    password,
  });

  await writeUsers(storage, users);

  const session = {
    email: normalizedEmail,
    token: buildToken(normalizedEmail),
  };

  await storage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function login(storage: StorageLike, email: string, password: string): Promise<AuthSession> {
  const normalizedEmail = normalizeEmail(email);
  const users = await readUsers(storage);
  const found = users.find((user) => user.email === normalizedEmail && user.password === password);

  if (!found) {
    throw new Error('Sai tài khoản hoặc mật khẩu.');
  }

  const session = {
    email: normalizedEmail,
    token: buildToken(normalizedEmail),
  };

  await storage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getSession(storage: StorageLike): Promise<AuthSession | null> {
  const raw = await storage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as AuthSession;
}

export async function logout(storage: StorageLike) {
  await storage.removeItem(SESSION_KEY);
}

function noteKey(email: string) {
  return `${ACCOUNT_NOTE_PREFIX}${normalizeEmail(email)}`;
}

export async function getAccountNote(storage: StorageLike, email: string): Promise<string | null> {
  return storage.getItem(noteKey(email));
}

export async function setAccountNote(storage: StorageLike, email: string, note: string) {
  await storage.setItem(noteKey(email), note);
}
