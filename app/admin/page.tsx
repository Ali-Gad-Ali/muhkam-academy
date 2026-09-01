import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminDashboard } from '@/components/admin-dashboard';
import { isLocalDemo, validateAdminToken } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!isLocalDemo()) {
    const token = (await cookies()).get('mh_admin_session')?.value;
    if (!(await validateAdminToken(token))) redirect('/admin/login');
  }
  return <AdminDashboard />;
}
