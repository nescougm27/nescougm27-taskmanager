import Link from 'next/link';
import { Leaf, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { login } from '@/app/actions/auth';
import { demoMode } from '@/lib/server/config';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errors: Record<string, string> = {
    AccessDenied:
      'This Google account is not an active committee member. Ask an administrator to add or reactivate it in Members.',
    unauthorized: 'Your Google account is not listed as an active committee member.',
    configuration:
      'Google sign-in is not configured. Complete the OAuth environment variables in README.md.',
    signin: 'Sign-in could not be completed. Please try again.',
  };
  return (
    <main className="login-page" id="main-content">
      <div className="login-brand">
        <Leaf size={29} />
        <strong>
          nesco <span>2027</span>
        </strong>
      </div>
      <div className="login-card">
        <span className="eyebrow">THE COMMITTEE WORKSPACE</span>
        <h1>
          Good things
          <br />
          are built together.
        </h1>
        <p>Your team. Your next idea. Your shared space to bring NESCO 2027 to life.</p>
        {error && (
          <div className="error-banner" role="alert">
            {errors[error] || 'Please try signing in again.'}
          </div>
        )}
        <form action={login}>
          <button type="submit" className="button button-primary google-login">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.3 2.9-7.5ZM12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2.1 1-3.4 1a6 6 0 0 1-5.6-4.1H3v2.7A10 10 0 0 0 12 22ZM6.4 13.9A6 6 0 0 1 6 12c0-.7.1-1.3.4-1.9V7.4H3A10 10 0 0 0 2 12c0 1.6.4 3.2 1 4.6l3.4-2.7ZM12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7A6 6 0 0 1 12 6Z"
              />
            </svg>
            Continue with Google <ArrowUpRight size={16} />
          </button>
        </form>
        {demoMode() && (
          <Link className="login-demo" href="/">
            Explore the demo workspace <ArrowUpRight size={15} />
          </Link>
        )}
        <div className="login-security">
          <ShieldCheck size={15} /> For authorized NESCO committee members
        </div>
      </div>
      <span className="login-footer">NESCO 2027 · WEB DEVELOPMENT</span>
    </main>
  );
}
