import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthError, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../lib/api';
import type { Profile } from '../types';

interface SignUpResult {
  error: string | null;
  /** true إذا أنشأ Supabase الحساب لكنه يطلب تأكيد البريد قبل الدخول */
  needsConfirmation: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (fullName: string, email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toArabicAuthError(error: AuthError): string {
  const code = error.code ?? '';
  const message = error.message ?? '';

  switch (code) {
    case 'invalid_credentials':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    case 'email_not_confirmed':
      return 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.';
    case 'email_address_invalid':
      return 'البريد الإلكتروني غير صالح. استخدم بريدًا حقيقيًا يدعم استلام الرسائل.';
    case 'email_exists':
    case 'user_already_exists':
      return 'هذا البريد الإلكتروني مسجل بالفعل.';
    case 'over_email_send_rate_limit':
      return 'تم تجاوز حد إرسال رسائل البريد المؤقت. انتظر قليلًا، أو اضبط مزود SMTP من إعدادات Supabase.';
    case 'over_request_rate_limit':
    case 'over_sms_send_rate_limit':
      return 'تم تجاوز عدد المحاولات المسموح. حاول بعد قليل.';
    case 'weak_password':
      return 'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل مع أرقام ورموز.';
    case 'password_too_short':
      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
    case 'signup_disabled':
      return 'تسجيل الحسابات الجديدة معطّل في هذا المشروع. راجع مشرف المشروع.';
    default:
      break;
  }

  if (message.includes('Invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (message.includes('Email not confirmed')) {
    return 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.';
  }
  if (message.includes('Password should be at least')) {
    return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
  }
  if (message.includes('User already registered')) {
    return 'هذا البريد الإلكتروني مسجل بالفعل.';
  }
  if (error.status === 429) {
    return 'تم تجاوز عدد المحاولات المسموح. حاول بعد قليل.';
  }
  return 'حدث خطأ في المصادقة. يرجى المحاولة مرة أخرى.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          const p = await fetchProfile(data.session.user.id);
          setProfile(p);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? toArabicAuthError(error) : null;
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: toArabicAuthError(error), needsConfirmation: false };
    const hasSession = Boolean(data.session);
    return { error: null, needsConfirmation: !hasSession };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, signIn, signUp, signOut, refreshProfile }),
    [user, profile, loading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
