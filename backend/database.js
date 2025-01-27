const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./medicalAppDB.sqlite', (err) => {
  if (err) {
    console.error('Error opening database ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Tabela użytkowników
    db.run(`CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Patient', 'Doctor', 'Admin'))
    )`);

    // Tabela konsultacji
    db.run(`CREATE TABLE IF NOT EXISTS consultations(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- Data konsultacji (YYYY-MM-DD)
      start_time TEXT NOT NULL, -- Godzina rozpoczęcia (HH:MM)
      end_time TEXT NOT NULL, -- Godzina zakończenia (HH:MM)
      type TEXT NOT NULL, -- Typ konsultacji (np. 'First Visit', 'Follow-up')
      status TEXT NOT NULL CHECK(status IN ('Booked', 'Cancelled', 'Completed')) DEFAULT 'Booked',
      notes TEXT,
      FOREIGN KEY (doctor_id) REFERENCES users(id),
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )`);

    // Tabela dostępności lekarza
    db.run(`CREATE TABLE IF NOT EXISTS doctor_availabilities(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      start_date TEXT NOT NULL, -- Data rozpoczęcia dostępności (YYYY-MM-DD)
      end_date TEXT NOT NULL, -- Data zakończenia dostępności (YYYY-MM-DD)
      days_mask TEXT NOT NULL, -- Maski dni (np. 'Mon,Tue,Thu')
      start_time TEXT NOT NULL, -- Godzina rozpoczęcia dostępności (HH:MM)
      end_time TEXT NOT NULL, -- Godzina zakończenia dostępności (HH:MM)
      FOREIGN KEY (doctor_id) REFERENCES users(id)
    )`);

    

    // Tabela niedostępności lekarza
    db.run(`CREATE TABLE IF NOT EXISTS doctor_absences(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- Data nieobecności (YYYY-MM-DD)
      reason TEXT, -- Powód nieobecności
      FOREIGN KEY (doctor_id) REFERENCES users(id)
    )`);

    console.log('Tables created or already exist.');
  }
});

module.exports = db;