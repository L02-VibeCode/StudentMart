import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getAccountNote,
  getSession,
  login,
  logout,
  register,
  setAccountNote,
  type AuthSession,
} from './src/features/auth/authStore';

type Screen = 'login' | 'register';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [accountNote, setCurrentAccountNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const currentSession = await getSession(AsyncStorage);
        setSession(currentSession);

        if (currentSession) {
          const note = await getAccountNote(AsyncStorage, currentSession.email);
          setCurrentAccountNote(note ?? '');
        }
      } catch {
        setError('Không thể khôi phục phiên đăng nhập.');
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await wait(300);
      const nextSession =
        screen === 'register'
          ? await register(AsyncStorage, email, password)
          : await login(AsyncStorage, email, password);

      setSession(nextSession);
      const note = await getAccountNote(AsyncStorage, nextSession.email);
      setCurrentAccountNote(note ?? '');
      setEmail('');
      setPassword('');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Đã có lỗi xảy ra.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setSubmitting(true);
    setError('');

    try {
      await wait(200);
      await logout(AsyncStorage);
      setSession(null);
      setCurrentAccountNote('');
      setScreen('login');
    } catch {
      setError('Không thể đăng xuất lúc này.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNote = async () => {
    if (!session) {
      return;
    }

    setSavingNote(true);
    setError('');

    try {
      await wait(200);
      await setAccountNote(AsyncStorage, session.email, accountNote);
    } catch {
      setError('Không thể lưu dữ liệu phiên.');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.caption}>Đang tải phiên đăng nhập...</Text>
      </SafeAreaView>
    );
  }

  if (session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Xin chào, {session.email}</Text>
        <Text style={styles.caption}>Token phiên: {session.token}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Ghi chú riêng theo tài khoản</Text>
          <TextInput
            placeholder="Nhập ghi chú cho tài khoản hiện tại"
            value={accountNote}
            onChangeText={setCurrentAccountNote}
            style={styles.input}
          />

          {accountNote ? (
            <Text style={styles.successText}>Đã có dữ liệu phiên cho tài khoản này.</Text>
          ) : (
            <Text style={styles.emptyText}>Empty state: tài khoản này chưa có dữ liệu phiên.</Text>
          )}

          <Button
            title={savingNote ? 'Đang lưu...' : 'Lưu dữ liệu phiên'}
            onPress={() => void handleSaveNote()}
            disabled={savingNote}
          />
        </View>

        <View style={styles.section}>
          <Button title={submitting ? 'Đang đăng xuất...' : 'Đăng xuất'} onPress={() => void handleLogout()} disabled={submitting} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{screen === 'login' ? 'Đăng nhập' : 'Đăng ký'}</Text>

      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        secureTextEntry
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <Button
        title={submitting ? 'Đang xử lý...' : screen === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        onPress={() => void handleSubmit()}
        disabled={submitting}
      />

      <View style={styles.switcher}>
        <Button
          title={screen === 'login' ? 'Chuyển sang đăng ký' : 'Chuyển sang đăng nhập'}
          onPress={() => {
            setScreen(screen === 'login' ? 'register' : 'login');
            setError('');
          }}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  caption: {
    color: '#525252',
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  section: {
    marginTop: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switcher: {
    marginTop: 8,
  },
  error: {
    color: '#dc2626',
    marginTop: 4,
  },
  successText: {
    color: '#16a34a',
  },
  emptyText: {
    color: '#a16207',
  },
});
