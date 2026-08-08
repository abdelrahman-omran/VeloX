import { z } from 'zod';

export const EmailSchema = z.string().trim().email('Enter a valid work email');

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name'),
  email: EmailSchema,
  password: PasswordSchema,
});

export type SignupInput = z.infer<typeof SignupSchema>;
