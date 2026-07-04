import { getCurrentBusiness } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const business = await getCurrentBusiness();

  return (
    <div>
      <PageHeader title="Settings" description="Business profile, edit-window policy, and backup/restore." />
      <SettingsClient
        initialSettings={{
          name: business.name,
          address: business.address ?? '',
          phone: business.phone ?? '',
          email: business.email ?? '',
          currency: business.currency,
          timezone: business.timezone,
          editWindowHours: business.edit_window_hours,
        }}
      />
    </div>
  );
}
