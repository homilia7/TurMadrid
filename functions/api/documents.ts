interface Env {
  DB: D1Database;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const category = url.searchParams.get('category');
  const travelerId = url.searchParams.get('travelerId');
  const tourId = url.searchParams.get('tourId');

  try {
    let query = 'SELECT * FROM documents WHERE 1=1';
    const params: string[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (travelerId) {
      query += ' AND (travelerId = ? OR travelerId = "")';
      params.push(travelerId);
    }
    if (tourId) {
      query += ' AND tourId = ?';
      params.push(tourId);
    }

    query += ' ORDER BY uploadedAt DESC';
    const res = await db.prepare(query).bind(...params).all();

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
    const doc = await context.request.json() as any;
    if (!doc.id || !doc.title) {
      return new Response(JSON.stringify({ error: 'Missing id or title' }), { status: 400 });
    }

    await db.prepare(`
      INSERT INTO documents (id, travelerId, tourId, category, title, fileName, fileType, dataUrl, fileSize, referenceNumber, seatOrSection, airline, flightNumber, terminal, gate, departureTime, arrivalTime, origin, destination, qrCodeText, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        travelerId = excluded.travelerId,
        tourId = excluded.tourId,
        category = excluded.category,
        title = excluded.title,
        fileName = excluded.fileName,
        fileType = excluded.fileType,
        dataUrl = excluded.dataUrl,
        fileSize = excluded.fileSize,
        referenceNumber = excluded.referenceNumber,
        seatOrSection = excluded.seatOrSection,
        airline = excluded.airline,
        flightNumber = excluded.flightNumber,
        terminal = excluded.terminal,
        gate = excluded.gate,
        departureTime = excluded.departureTime,
        arrivalTime = excluded.arrivalTime,
        origin = excluded.origin,
        destination = excluded.destination,
        qrCodeText = excluded.qrCodeText,
        notes = excluded.notes
    `).bind(
      doc.id,
      doc.travelerId || '',
      doc.tourId || '',
      doc.category || 'entrada',
      doc.title || '',
      doc.fileName || '',
      doc.fileType || 'digital',
      doc.dataUrl || '',
      doc.fileSize || '',
      doc.referenceNumber || '',
      doc.seatOrSection || '',
      doc.airline || '',
      doc.flightNumber || '',
      doc.terminal || '',
      doc.gate || '',
      doc.departureTime || '',
      doc.arrivalTime || '',
      doc.origin || '',
      doc.destination || '',
      doc.qrCodeText || '',
      doc.notes || ''
    ).run();

    return new Response(JSON.stringify({ success: true, id: doc.id }), {
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

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }

  try {
    await db.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true, id }), {
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
