import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    'bg-velox-brand text-white hover:bg-velox-hover disabled:bg-velox-border disabled:text-velox-muted',
  secondary:
    'border border-velox-border bg-velox-elevated text-velox-text hover:border-velox-brand/50 disabled:opacity-50',
  ghost: 'text-velox-muted hover:bg-velox-elevated hover:text-velox-text disabled:opacity-50',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${variants[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
