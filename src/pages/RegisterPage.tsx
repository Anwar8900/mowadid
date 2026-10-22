import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isValidEmail, isValidPassword } from '../lib/validation';
import { SetupNotice } from '../components/SetupNotice';
import { PasswordInput } from '../components/PasswordInput';

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setSuccess(null);
    if (fullName.trim().length < 2) {
      setError('يرجى إدخال الاسم الكامل.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setLoading(true);
    const result = await signUp(fullName.trim(), email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setSuccess(
        'تم إنشاء الحساب بنجاح. افتح بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول. (إذا لم تصلك الرسالة، فعّل «تأكيد البريد» من إعدادات Supabase أو عطّله للتجربة المحلية)',
      );
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <SetupNotice />
        <h1 className="auth-title">إنشاء حساب جديد</h1>
        <p className="auth-subtitle">أنشئ حسابًا لإدارة مواعيدك</p>
        <form onSubmit={handleSubmit} className="form" dir="auto">
          <div className="field">
            <label htmlFor="fullName">الاسم الكامل</label>
            <input
              id="fullName"
              type="text"
              dir="auto"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="hint">6 أحرف على الأقل. اضغط رمز العين للتأكد مما كتبته.</span>
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
          </button>
        </form>
        <div className="auth-links">
          <span>لديك حساب بالفعل؟</span>
          <Link to="/login">تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}
