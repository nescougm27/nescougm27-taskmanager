import 'server-only';
import { auth } from '@/auth';
import type { SessionUser } from '../schema';
import { AppError } from '../errors';
import { appOrigin } from './config';
export async function getUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.email || !session.user.active) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || session.user.email,
    role: session.user.role,
    image: session.user.image || undefined,
  };
}
export async function requireUser() {
  const user = await getUser();
  if (!user) throw new AppError(401, 'Sign in with an authorized committee Google account.');
  return user;
}
export function canReview(user: SessionUser) {
  return user.role === 'admin';
}
export function requireAdmin(user: SessionUser) {
  if (user.role !== 'admin')
    throw new AppError(403, 'Only workspace administrators can perform this action.');
}
export function checkOrigin(request: Request) {
  if (request.headers.get('origin') !== appOrigin())
    throw new AppError(
      403,
      'Request origin was not accepted. Refresh the workspace and try again.',
    );
}
export function requireWriter(user: SessionUser) {
  if (user.role === 'viewer')
    throw new AppError(
      403,
      'Your account has read-only access. Ask an administrator to change your role.',
    );
}
