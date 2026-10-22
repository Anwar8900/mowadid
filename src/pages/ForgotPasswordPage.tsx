import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SetupNotice } from '../components/SetupNotice';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (resetError) {
      setError('تعذر إرسال رابط استعادة كلمة المرور. يرجى المحاولة لاحقًا.');
      return;
    }
    setMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.');
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <SetupNotice />
        <h1 className="auth-title">استعادة كلمة المرور</h1>
        <p className="auth-subtitle">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
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
          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'جارٍ الإرسال...' : 'إرسال رابط الاستعادة'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">← العودة إلى تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}
