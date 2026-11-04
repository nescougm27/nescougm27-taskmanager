'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="not-found" id="main-content">
      <h1>The workspace needs a moment.</h1>
      <p>Something interrupted this page. Please try loading it again.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
