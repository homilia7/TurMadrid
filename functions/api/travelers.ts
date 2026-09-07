interface Env {
  DB: D1Database;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  try {
    const res = await db.prepare('SELECT * FROM travelers ORDER BY createdAt ASC').all();
    return new Response(JSON.stringify(res.results || []), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  try {
    const t = await context.request.json() as any;
    if (!t.id || !t.name) {
      return new Response(JSON.stringify({ error: 'Missing id or name' }), { status: 400 });
    }

    await db.prepare(`
      INSERT INTO travelers (id, name, avatarColor, avatarIcon, passportNumber, passportExpiry, nationality, emergencyContact, notes, passportDocUrl, passportDocName, passportDocType, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        avatarColor = excluded.avatarColor,
        avatarIcon = excluded.avatarIcon,
        passportNumber = excluded.passportNumber,
        passportExpiry = excluded.passportExpiry,
        nationality = excluded.nationality,
        emergencyContact = excluded.emergencyContact,
        notes = excluded.notes,
        passportDocUrl = excluded.passportDocUrl,
        passportDocName = excluded.passportDocName,
        passportDocType = excluded.passportDocType,
        updatedAt = CURRENT_TIMESTAMP
    `).bind(
      t.id,
      t.name,
      t.avatarColor || '#3B82F6',
      t.avatarIcon || '',
      t.passportNumber || '',
      t.passportExpiry || '',
      t.nationality || '',
      t.emergencyContact || '',
      t.notes || '',
      t.passportDocUrl || '',
      t.passportDocName || '',
      t.passportDocType || ''
    ).run();

    return new Response(JSON.stringify({ success: true, traveler: t }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
