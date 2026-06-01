'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function readCreds(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  return { email, password };
}

export async function signIn(formData: FormData) {
  const { email, password } = readCreds(formData);
  const next = String(formData.get('next') ?? '/');

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signUp(formData: FormData) {
  const { email, password } = readCreds(formData);
  const next = String(formData.get('next') ?? '/');

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}` }
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  // If email confirmation is on, the user must confirm before a session exists.
  redirect(`/login?message=${encodeURIComponent('Check your email to confirm your account, then sign in.')}`);
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const next = String(formData.get('next') ?? '/');

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}` }
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(`/login?message=${encodeURIComponent('Check your email for a sign-in link.')}`);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
