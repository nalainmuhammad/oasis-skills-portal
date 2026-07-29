import { AdminStats, UserProfile } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com';

export async function getAdminStats(token: string): Promise<AdminStats | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return null;
  }
}

export async function getVolunteersFiltered(filters: Record<string, string>, token: string): Promise<any[]> {
  try {
    const searchParams = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/api/admin/volunteers?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching volunteers list:', error);
    return [];
  }
}

export async function approveVolunteer(publicId: string, token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/admin/volunteers/${publicId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to approve volunteer' }));
    throw new Error(err.detail || 'Failed to approve volunteer');
  }

  return await res.json();
}

export async function rejectVolunteer(publicId: string, token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/admin/volunteers/${publicId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to reject volunteer application' }));
    throw new Error(err.detail || 'Failed to reject volunteer application');
  }

  return await res.json();
}
