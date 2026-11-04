import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'NESCO 2027 · Web Development Workspace', template: '%s · NESCO 2027' },
  description:
    'A shared workspace for the NESCO 2027 Web Development Committee. Plan thoughtfully. Build together.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
