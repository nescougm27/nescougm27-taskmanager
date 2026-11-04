'use server';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';
export async function login() {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.AUTH_SECRET
  )
    redirect('/login?error=configuration');
  await signIn('google', { redirectTo: '/dashboard' });
}
export async function logout() {
  await signOut({ redirectTo: '/login' });
}
