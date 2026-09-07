-- Schema for TurMadrid Cloudflare D1 Database

CREATE TABLE IF NOT EXISTS travelers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatarColor TEXT NOT NULL,
  avatarIcon TEXT,
  passportNumber TEXT,
  passportExpiry TEXT,
  nationality TEXT,
  emergencyContact TEXT,
  notes TEXT,
  passportDocUrl TEXT,
  passportDocName TEXT,
  passportDocType TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  travelerId TEXT,
  tourId TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileType TEXT NOT NULL,
  dataUrl TEXT NOT NULL,
  fileSize TEXT,
  referenceNumber TEXT,
  seatOrSection TEXT,
  airline TEXT,
  flightNumber TEXT,
  terminal TEXT,
  gate TEXT,
  departureTime TEXT,
  arrivalTime TEXT,
  origin TEXT,
  destination TEXT,
  qrCodeText TEXT,
  notes TEXT,
  uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tours (
  id TEXT PRIMARY KEY,
  dayNumber INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  meetingPoint TEXT,
  description TEXT,
  durationHours REAL,
  alertHoursBefore INTEGER DEFAULT 3,
  alertEnabled INTEGER DEFAULT 1,
  visitedByUserIds TEXT DEFAULT '[]',
  notes TEXT,
  imageThumbnail TEXT,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS days (
  dayNumber INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  dayName TEXT NOT NULL,
  city TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
