import { Activity, ActivityApplication } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getActivities(params?: { category?: string; search?: string }): Promise<Activity[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/api/activities?${query.toString()}`, {
      cache: 'no-store'
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

export async function getActivity(public_id: string): Promise<Activity | null> {
  try {
    const res = await fetch(`${API_BASE}/api/activities/${public_id}`, {
      cache: 'no-store'
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching activity:', error);
    return null;
  }
}

export async function applyActivity(public_id: string, position: string, token: string): Promise<ActivityApplication> {
  const res = await fetch(`${API_BASE}/api/activities/${public_id}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ applied_position: position })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to apply' }));
    throw new Error(err.detail || 'Failed to apply for activity');
  }

  return await res.json();
}

export async function withdrawActivity(public_id: string, token: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/activities/${public_id}/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('Failed to withdraw application');
  }

  return await res.json();
}

export async function getMyApplications(token: string): Promise<ActivityApplication[]> {
  try {
    const res = await fetch(`${API_BASE}/api/activities/my-applications/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching my applications:', error);
    return [];
  }
}

// ── ADMIN HELPERS ──

export async function createActivity(data: Partial<Activity>, token: string): Promise<Activity> {
  const res = await fetch(`${API_BASE}/api/activities/admin/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create activity' }));
    throw new Error(err.detail || 'Failed to create activity');
  }

  return await res.json();
}

export async function listAllApplications(token: string, status_filter?: string): Promise<ActivityApplication[]> {
  const query = status_filter ? `?status_filter=${status_filter}` : '';
  const res = await fetch(`${API_BASE}/api/activities/admin/applications/all${query}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    cache: 'no-store'
  });

  if (!res.ok) return [];
  return await res.json();
}

export async function updateApplicationStatus(
  app_id: number,
  status: string,
  admin_notes: string | undefined,
  token: string
): Promise<ActivityApplication> {
  const res = await fetch(`${API_BASE}/api/activities/admin/applications/${app_id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status, admin_notes })
  });

  if (!res.ok) {
    throw new Error('Failed to update application status');
  }

  return await res.json();
}
