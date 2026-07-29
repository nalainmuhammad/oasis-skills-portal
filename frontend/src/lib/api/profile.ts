import { UserProfile, IdCardData } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getProfile(token?: string): Promise<UserProfile | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers,
      cache: 'no-store'
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateProfile(data: Partial<UserProfile>, token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Failed to update profile');
  }

  return await res.json();
}

export async function getIdCard(token: string): Promise<IdCardData> {
  const res = await fetch(`${API_BASE}/api/auth/id-card`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch ID card' }));
    throw new Error(err.detail || 'Failed to fetch ID card');
  }

  return await res.json();
}

export async function applyForVolunteerVerification(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/apply-volunteer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit volunteer application' }));
    throw new Error(err.detail || 'Failed to submit volunteer application');
  }

  return await res.json();
}
