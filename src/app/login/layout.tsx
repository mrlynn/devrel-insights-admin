import ThemeProvider from '@/theme/ThemeProvider';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page has its own layout without AdminLayout
  return <ThemeProvider>{children}</ThemeProvider>;
}
