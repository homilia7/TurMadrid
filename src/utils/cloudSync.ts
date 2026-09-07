import { Traveler, Tour, ItineraryDay, DocumentItem } from '../types';

const API_BASE = '/api';

export async function fetchCloudData(): Promise<{
  travelers: Traveler[];
  tours: Tour[];
  days: ItineraryDay[];
  documents: DocumentItem[];
} | null> {
  try {
    const res = await fetch(`${API_BASE}/data`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      console.warn('Cloudflare D1 fetch returned non-200 status:', res.status);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Could not connect to Cloudflare D1 (likely offline or local mock):', err);
    return null;
  }
}

export async function syncToCloud(data: {
  travelers?: Traveler[];
  tours?: Tour[];
  days?: ItineraryDay[];
  documents?: DocumentItem[];
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json.success === true;
  } catch (err) {
    console.error('Error syncing to Cloudflare D1:', err);
    return false;
  }
}

export async function uploadDocumentToCloud(doc: DocumentItem): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    return res.ok;
  } catch (err) {
    console.error('Error uploading document to Cloudflare D1:', err);
    return false;
  }
}

export async function deleteDocumentFromCloud(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/documents?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting document from Cloudflare D1:', err);
    return false;
  }
}

export async function saveTravelerToCloud(traveler: Traveler): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/travelers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(traveler),
    });
    return res.ok;
  } catch (err) {
    console.error('Error updating traveler in Cloudflare D1:', err);
    return false;
  }
}
