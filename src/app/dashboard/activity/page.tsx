import { getActivity } from '@/features/activity/actions/get-activity';
import ActivityPageClient from './activity-page-client';

export default async function ActivityPage() {
  try {
    const result = await getActivity({ page: 1, limit: 20 });
    if (result.success && result.data) {
      return <ActivityPageClient initialData={result.data} />;
    }
  } catch {
    // fallback to client-only fetch
  }

  return <ActivityPageClient />;
}
