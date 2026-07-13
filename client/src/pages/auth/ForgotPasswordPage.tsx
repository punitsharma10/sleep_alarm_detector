import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, KeyRound } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { forgotPassword, resetPassword } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit } = useForm<{ email: string }>();

  const requestReset = async (values: { email: string }) => {
    setBusy(true);
    try {
      const resetToken = await forgotPassword(values.email);
      setEmail(values.email);
      toast.success('If the account exists, a reset token was issued.');
      // Demo flow: the backend returns the token directly so the reset can proceed.
      if (resetToken) {
        setToken(resetToken);
        setStep('reset');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await resetPassword(token, password);
      toast.success('Password updated — you can sign in now.');
      setStep('request');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={step === 'request' ? 'Reset password' : 'Set new password'}
      subtitle={
        step === 'request'
          ? 'Enter your email to receive a reset token'
          : `Resetting password for ${email}`
      }
      footer={
        <Link to="/login" className="font-semibold text-brand-500 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {step === 'request' ? (
        <form onSubmit={handleSubmit(requestReset)} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="email" type="email" className="input pl-9" placeholder="you@example.com" {...register('email', { required: true })} />
            </div>
          </div>
          <Button type="submit" className="w-full" loading={busy} size="lg">
            Send reset token
          </Button>
        </form>
      ) : (
        <form onSubmit={submitReset} className="space-y-4">
          <div>
            <label className="label" htmlFor="token">Reset token</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="token"
                className="input pl-9 font-mono text-xs"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="new-password">New password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="new-password"
                type="password"
                className="input pl-9"
                placeholder="At least 8 characters"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" loading={busy} size="lg">
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
