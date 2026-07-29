import { NotificationItem } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com';

export async function getNotifications(token: string): Promise<NotificationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/notifications/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function markNotificationRead(public_id: string, token: string): Promise<void> {
  await fetch(`${API_BASE}/api/notifications/${public_id}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
