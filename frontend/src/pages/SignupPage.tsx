import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { SignupSchema } from '../schemas/auth';

export function SignupPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsed = SignupSchema.safeParse({ name, email, password });
  const fieldErrors = parsed.success
    ? {}
    : Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true });
    const result = SignupSchema.safeParse({ name, email, password });
    if (!result.success) {
      setSubmitError(result.error.issues[0]?.message ?? 'Check the form');
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
        <h1 className="text-2xl font-bold text-velox-text">Create account</h1>
        <p className="mt-2 text-sm text-velox-muted">
          Open Glass and start the morning triage inbox.
        </p>

        <div className="mt-6">
          <Alert
            variant="info"
            title="Hackathon demo — signup is a placeholder"
            message="Nothing is stored. Continue to explore the dashboard."
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              aria-invalid={Boolean(touched.name && fieldErrors.name)}
              className="w-full rounded-md border border-velox-border bg-velox-elevated px-3 py-2.5 text-sm text-velox-text focus:border-velox-brand"
            />
            {touched.name && fieldErrors.name ? (
              <p className="mt-1 text-xs text-velox-high" role="alert">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

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
              autoComplete="new-password"
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
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-velox-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-velox-brand hover:text-velox-hover">
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}
