import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="not-found" id="main-content">
      <span className="eyebrow">404 · A LITTLE OFF TRACK</span>
      <h1>This page hasn’t been built yet.</h1>
      <p>Let’s get you back to the workspace.</p>
      <Link href="/" className="button button-primary">
        Back to overview
      </Link>
    </main>
  );
}
