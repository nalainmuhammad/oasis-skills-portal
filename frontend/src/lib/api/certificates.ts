import { auth } from "@/auth";
import { CertificateTemplateItem } from "@/types";

export interface CertificateItem {
  verification_uuid: string;
  certificate_number?: string | null;
  title_snapshot?: string;
  course_title_snapshot?: string;
  recipient_name_snapshot: string;
  role_snapshot?: string | null;
  cert_type?: string;
  status: string;
  issued_at: string;
  pdf_url?: string | null;
  verification_url?: string;
}

export type Certificate = CertificateItem;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com';

export async function getMyCertificates(token?: string): Promise<CertificateItem[]> {
  try {
    let authToken = token;
    if (!authToken) {
      const session = await auth();
      authToken = session?.accessToken;
    }
    if (!authToken) return [];

    const res = await fetch(`${API_BASE}/api/me/certificates`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      cache: 'no-store'
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching certificates:", err);
    return [];
  }
}

export async function verifyCertificate(uuid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/verify/${uuid}`, {
    cache: 'no-store'
  });

  if (!res.ok) throw new Error("Failed to verify certificate");
  return res.json();
}

// ── ADMIN CERTIFICATE HELPERS ──

export async function getCertificateTemplates(token: string): Promise<CertificateTemplateItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/templates`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching templates:", err);
    return [];
  }
}

export async function createCertificateTemplate(data: Partial<CertificateTemplateItem>, token: string): Promise<CertificateTemplateItem> {
  const res = await fetch(`${API_BASE}/api/templates/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error('Failed to create template');
  return await res.json();
}

export async function updateTemplatePositions(tmpl_id: string, custom_positions: Record<string, any>, token: string): Promise<CertificateTemplateItem> {
  const res = await fetch(`${API_BASE}/api/templates/${tmpl_id}/positions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(custom_positions)
  });

  if (!res.ok) throw new Error('Failed to update template positions');
  return await res.json();
}

export async function issueIndividualCertificate(data: { user_id: string; template_id?: string; title: string; role?: string }, token: string): Promise<CertificateItem> {
  const res = await fetch(`${API_BASE}/api/issue/individual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to issue certificate' }));
    throw new Error(err.detail || 'Failed to issue certificate');
  }

  return await res.json();
}

export async function issueProgramCertificates(data: { activity_id: string; template_id?: string; custom_title?: string }, token: string): Promise<{ message: string; issued_count: number }> {
  const res = await fetch(`${API_BASE}/api/issue/program`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to issue program certificates' }));
    throw new Error(err.detail || 'Failed to issue program certificates');
  }

  return await res.json();
}
