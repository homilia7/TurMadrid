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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 binding DB not found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const body = await context.request.json() as any;
    const { travelers, tours, days, documents } = body;

    const statements: D1PreparedStatement[] = [];

    if (Array.isArray(travelers)) {
      for (const t of travelers) {
        statements.push(
          db.prepare(`
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
            t.name || '',
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
          )
        );
      }
    }

    if (Array.isArray(tours)) {
      for (const tour of tours) {
        statements.push(
          db.prepare(`
            INSERT INTO tours (id, dayNumber, date, time, title, city, category, location, meetingPoint, description, durationHours, alertHoursBefore, alertEnabled, visitedByUserIds, notes, imageThumbnail, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              dayNumber = excluded.dayNumber,
              date = excluded.date,
              time = excluded.time,
              title = excluded.title,
              city = excluded.city,
              category = excluded.category,
              location = excluded.location,
              meetingPoint = excluded.meetingPoint,
              description = excluded.description,
              durationHours = excluded.durationHours,
              alertHoursBefore = excluded.alertHoursBefore,
              alertEnabled = excluded.alertEnabled,
              visitedByUserIds = excluded.visitedByUserIds,
              notes = excluded.notes,
              imageThumbnail = excluded.imageThumbnail,
              updatedAt = CURRENT_TIMESTAMP
          `).bind(
            tour.id,
            tour.dayNumber,
            tour.date,
            tour.time,
            tour.title,
            tour.city,
            tour.category,
            tour.location,
            tour.meetingPoint || '',
            tour.description || '',
            tour.durationHours || 2,
            tour.alertHoursBefore || 3,
            tour.alertEnabled ? 1 : 0,
            JSON.stringify(tour.visitedByUserIds || []),
            tour.notes || '',
            tour.imageThumbnail || ''
          )
        );
      }
    }

    if (Array.isArray(days)) {
      for (const d of days) {
        statements.push(
          db.prepare(`
            INSERT INTO days (dayNumber, date, dayName, city, title, subtitle)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(dayNumber) DO UPDATE SET
              date = excluded.date,
              dayName = excluded.dayName,
              city = excluded.city,
              title = excluded.title,
              subtitle = excluded.subtitle
          `).bind(
            d.dayNumber,
            d.date,
            d.dayName,
            d.city,
            d.title,
            d.subtitle || ''
          )
        );
      }
    }

    if (Array.isArray(documents)) {
      for (const doc of documents) {
        statements.push(
          db.prepare(`
            INSERT INTO documents (id, travelerId, tourId, category, title, fileName, fileType, dataUrl, fileSize, referenceNumber, seatOrSection, airline, flightNumber, terminal, gate, departureTime, arrivalTime, origin, destination, qrCodeText, qrCropUrl, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
              qrCropUrl = excluded.qrCropUrl,
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
            doc.qrCropUrl || '',
            doc.notes || ''
          )
        );
      }
    }

    if (statements.length > 0) {
      for (let i = 0; i < statements.length; i += 25) {
        const batch = statements.slice(i, i + 25);
        await db.batch(batch);
      }
    }

    return new Response(JSON.stringify({ success: true, count: statements.length }), {
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
