import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, User as UserIcon, Building2 } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { PASSWORD_REGEX, PASSWORD_HINT } from '@/lib/validators';

interface FormValues {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const { signupOrg } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      const message = await signupOrg(
        values.organizationName,
        values.name,
        values.email,
        values.password
      );
      toast.success(message || 'Organization registered — pending approval.', { duration: 6000 });
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <AuthShell
      title="Register your organization"
      subtitle="Create an organization account — an admin will approve it before you can sign in"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-500 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate autoComplete="off">
        <div>
          <label className="label" htmlFor="organizationName">Organization name <span className="text-red-500">*</span></label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="organizationName"
              className="input pl-9"
              placeholder="Acme Logistics"
              {...register('organizationName', { required: 'Organization name is required', minLength: { value: 2, message: 'Too short' } })}
            />
          </div>
          {errors.organizationName && <p className="mt-1 text-xs text-red-500">{errors.organizationName.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="name">Admin full name <span className="text-red-500">*</span></label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="name"
              autoComplete="off"
              className="input pl-9"
              placeholder="Jane Doe"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })}
            />
          </div>
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="email">Admin email <span className="text-red-500">*</span></label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="off"
              className="input pl-9"
              placeholder="admin@acme.com"
              {...register('email', { required: 'Email is required' })}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="password">Password <span className="text-red-500">*</span></label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            {...register('password', {
              required: 'Password is required',
              pattern: { value: PASSWORD_REGEX, message: PASSWORD_HINT },
            })}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{PASSWORD_HINT}</p>
          )}
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
          Register organization
        </Button>
      </form>
    </AuthShell>
  );
}
