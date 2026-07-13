import { Toaster } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

/** Toaster that follows the app's theme toggle instead of the OS setting. */
export function ThemedToaster() {
  const { resolved } = useTheme();
  return <Toaster richColors closeButton position="top-right" theme={resolved} />;
}
