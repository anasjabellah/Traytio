import { getTeam } from '@/features/team/actions/get-team';
import TeamPageClient from './team-page-client';

export default async function TeamSettingsPage() {
  const result = await getTeam({ page: 1, limit: 20 });

  if (result.success && result.data) {
    return <TeamPageClient initialData={result.data} />;
  }

  return <TeamPageClient />;
}
