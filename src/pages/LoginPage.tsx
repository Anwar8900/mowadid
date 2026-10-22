import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SetupNotice } from '../components/SetupNotice';
import { PasswordInput } from '../components/PasswordInput';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    const err = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <SetupNotice />
        <h1 className="auth-title">مرحبًا بعودتك</h1>
        <p className="auth-subtitle">سجّل دخولك إلى مواعيدي</p>
        <form onSubmit={handleSubmit} className="form" dir="auto">
          <div className="field">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              dir="auto"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/forgot-password">نسيت كلمة المرور؟</Link>
          <span>ليس لديك حساب؟</span>
          <Link to="/register">إنشاء حساب جديد</Link>
        </div>
      </div>
    </div>
  );
}
