import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/common/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 text-center dark:bg-[#0b1120]">
      <Logo />
      <div>
        <p className="text-7xl font-black text-brand-500">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
        <p className="mt-1 text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      </div>
      <Link to="/">
        <Button size="lg">Back to home</Button>
      </Link>
    </div>
  );
}
