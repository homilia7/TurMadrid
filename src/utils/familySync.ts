import { WallPost, FamilyMessage, PresenceUser, LiveLocationShare } from '../types';

export async function fetchFamilyData(): Promise<{
  wallPosts: WallPost[];
  messages: FamilyMessage[];
  presenceUsers: PresenceUser[];
  locations: LiveLocationShare[];
}> {
  try {
    const res = await fetch('/api/family');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      wallPosts: Array.isArray(data.wallPosts) ? data.wallPosts : [],
      messages: Array.isArray(data.messages) ? data.messages : [],
      presenceUsers: Array.isArray(data.presenceUsers) ? data.presenceUsers : [],
      locations: Array.isArray(data.locations) ? data.locations : [],
    };
  } catch (err) {
    console.warn('Could not fetch family data from D1, using local fallback:', err);
    return {
      wallPosts: [],
      messages: [],
      presenceUsers: [],
      locations: [],
    };
  }
}

export async function sendWallPostToCloud(post: WallPost): Promise<void> {
  try {
    await fetch('/api/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'wall_post', payload: post }),
    });
  } catch (err) {
    console.warn('Error sending wall post to cloud:', err);
  }
}

export async function sendFamilyMessageToCloud(msg: FamilyMessage): Promise<void> {
  try {
    await fetch('/api/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'family_message', payload: msg }),
    });
  } catch (err) {
    console.warn('Error sending family message to cloud:', err);
  }
}

export async function sendPresenceHeartbeatToCloud(user: PresenceUser): Promise<void> {
  try {
    await fetch('/api/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'presence', payload: user }),
    });
  } catch (err) {
    console.warn('Error sending presence heartbeat to cloud:', err);
  }
}

export async function sendLocationToCloud(location: LiveLocationShare): Promise<void> {
  try {
    await fetch('/api/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'location', payload: location }),
    });
  } catch (err) {
    console.warn('Error sending location to cloud:', err);
  }
}

export async function clearChatInCloud(options: {
  travelerName?: string;
  targetUserName?: string;
  clearAll?: boolean;
}): Promise<void> {
  try {
    await fetch('/api/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'clear_chat', payload: options }),
    });
  } catch (err) {
    console.warn('Error clearing chat in cloud:', err);
  }
}

export async function markFamilyMessagesReadInCloud(
  ids: string[],
  readerType: 'traveler' | 'family'
): Promise<void> {
  try {
    if (!ids || ids.length === 0) return;
    await fetch('/api/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mark_read', payload: { ids, readerType } }),
    });
  } catch (err) {
    console.warn('Error marking messages as read in cloud:', err);
  }
}

