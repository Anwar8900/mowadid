import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isValidPassword } from '../lib/validation';
import { PasswordInput } from '../components/PasswordInput';
import { SetupNotice } from '../components/SetupNotice';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!isValidPassword(password)) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      const code = (updateError as { code?: string }).code ?? '';
      const message = updateError.message.toLowerCase();
      if (code === 'same_password' || message.includes('same password')) {
        setError('كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية.');
      } else if (code === 'weak_password' || message.includes('weak')) {
        setError('كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل مع مزيج من الحروف والأرقام.');
      } else if (message.includes('session')) {
        setError('انتهت صلاحية رابط الاستعادة أو لم تفتح الرابط من رسالة البريد. اطلب رابطًا جديدًا.');
      } else {
        setError('تعذر تغيير كلمة المرور. حاول مرة أخرى.');
      }
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <SetupNotice />
        <h1 className="auth-title">تعيين كلمة مرور جديدة</h1>
        <p className="auth-subtitle">اختر كلمة مرور جديدة لحسابك</p>

        {success ? (
          <>
            <p className="form-success">تم تغيير كلمة المرور بنجاح. يمكنك الآن استخدام التطبيق بكلمة المرور الجديدة.</p>
            <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/')}>
              المتابعة إلى التطبيق
            </button>
          </>
        ) : (
          <form className="form" onSubmit={handleSubmit} dir="auto">
            <div className="field">
              <label htmlFor="new-password">كلمة المرور الجديدة</label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">تأكيد كلمة المرور</label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/forgot-password">← طلب رابط استعادة جديد</Link>
        </div>
      </div>
    </div>
  );
}
