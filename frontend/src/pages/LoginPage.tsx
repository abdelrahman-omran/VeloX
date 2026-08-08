import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { LoginSchema } from '../schemas/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsed = LoginSchema.safeParse({ email, password });
  const fieldErrors = parsed.success
    ? {}
    : Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      setSubmitError(result.error.issues[0]?.message ?? 'Check your credentials');
      return;
    }
    setSubmitError(null);
    pushToast('Demo mode — no account created');
    void navigate('/app');
  };

  return (
    <div className="flex min-h-screen flex-col bg-velox-bg text-velox-text">
      <header className="border-b border-velox-border px-4 py-4">
        <Link to="/" className="inline-flex">
          <Logo size={28} />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-bold text-velox-text">Log in</h1>
        <p className="mt-2 text-sm text-velox-muted">
          Continue to Glass for the demo triage inbox.
        </p>

        <div className="mt-6">
          <Alert
            variant="info"
            title="Hackathon demo"
            message="Login is a placeholder — nothing is authenticated."
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={Boolean(touched.email && fieldErrors.email)}
              className="w-full rounded-md border border-velox-border bg-velox-elevated px-3 py-2.5 text-sm text-velox-text focus:border-velox-brand"
            />
            {touched.email && fieldErrors.email ? (
              <p className="mt-1 text-xs text-velox-high" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={Boolean(touched.password && fieldErrors.password)}
              className="w-full rounded-md border border-velox-border bg-velox-elevated px-3 py-2.5 text-sm text-velox-text focus:border-velox-brand"
            />
            {touched.password && fieldErrors.password ? (
              <p className="mt-1 text-xs text-velox-high" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {submitError ? (
            <Alert variant="error" title="Could not continue" message={submitError} />
          ) : null}

          <Button type="submit" variant="primary" className="w-full">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-velox-muted">
          Need an account?{' '}
          <Link to="/signup" className="text-velox-brand hover:text-velox-hover">
            Sign up
          </Link>
        </p>
      </main>
    </div>
  );
}
