import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * حقل كلمة مرور مع زر إظهار/إخفاء (بدون تغيير في بنية الاستخدام).
 */
export function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        title={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
