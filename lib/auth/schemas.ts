import { z } from 'zod';

/**
 * Auth validation schemas shared by the client forms and the API routes.
 *
 * Every `message` is a *translation key* under `auth.validation`, never user
 * facing copy — forms resolve it through next-intl before rendering.
 */

const email = z
  .string({ required_error: 'emailRequired' })
  .min(1, 'emailRequired')
  .email('emailInvalid');

const password = z
  .string({ required_error: 'passwordRequired' })
  .min(8, 'passwordTooShort')
  // bcrypt silently truncates beyond 72 bytes, so reject longer inputs outright.
  .max(72, 'passwordTooLong');

const name = z
  .string({ required_error: 'nameRequired' })
  .trim()
  .min(1, 'nameRequired')
  .max(60, 'nameTooLong');

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'passwordRequired' }).min(1, 'passwordRequired'),
});

export const registerSchema = z
  .object({
    name,
    email,
    password,
    confirmPassword: z.string({ required_error: 'passwordRequired' }).min(1, 'passwordRequired'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'passwordsDoNotMatch',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string({ required_error: 'tokenRequired' }).min(1, 'tokenRequired'),
    password,
    confirmPassword: z.string({ required_error: 'passwordRequired' }).min(1, 'passwordRequired'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'passwordsDoNotMatch',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
