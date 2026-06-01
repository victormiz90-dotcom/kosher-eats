import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3 border-b border-brand-100 pb-3 text-sm">
        <span className="font-semibold text-brand-900">Admin</span>
        <Link href="/admin" className="text-brand-700 hover:text-brand-900">
          Dashboard
        </Link>
        <Link href="/admin/restaurants/new" className="text-brand-700 hover:text-brand-900">
          Add restaurant
        </Link>
        <Link href="/admin/queue" className="text-brand-700 hover:text-brand-900">
          Verification queue
        </Link>
      </div>
      {children}
    </div>
  );
}
