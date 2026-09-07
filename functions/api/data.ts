interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 binding DB not found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const [travelersRes, documentsRes, toursRes, daysRes, settingsRes] = await Promise.all([
      db.prepare('SELECT * FROM travelers ORDER BY createdAt ASC').all(),
      db.prepare('SELECT * FROM documents ORDER BY uploadedAt DESC').all(),
      db.prepare('SELECT * FROM tours ORDER BY dayNumber ASC, time ASC').all(),
      db.prepare('SELECT * FROM days ORDER BY dayNumber ASC').all(),
      db.prepare('SELECT * FROM settings').all(),
    ]);

    const documents = documentsRes.results || [];

    const tours = (toursRes.results || []).map((t: any) => {
      let visited: string[] = [];
      try {
        if (typeof t.visitedByUserIds === 'string') {
          visited = JSON.parse(t.visitedByUserIds);
        } else if (Array.isArray(t.visitedByUserIds)) {
          visited = t.visitedByUserIds;
        }
      } catch {
        visited = [];
      }

      // Attach matching tickets to tour
      const tourTickets = documents.filter((doc: any) => doc.tourId === t.id);

      return {
        ...t,
        alertEnabled: Boolean(t.alertEnabled),
        visitedByUserIds: Array.isArray(visited) ? visited : [],
        tickets: tourTickets,
      };
    });

    return new Response(
      JSON.stringify({
        travelers: travelersRes.results || [],
        documents,
        tours,
        days: daysRes.results || [],
        settings: (settingsRes.results || []).reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {}),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
