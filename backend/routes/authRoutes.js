const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const router = express.Router();
const jwt = require('jsonwebtoken');


// Rejestracja użytkownika
router.post('/register', async (req, res) => {
  const { name, lastName, email, password, role} = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 8);

    // Wstawianie użytkownika do tabeli users
    db.run(
      `INSERT INTO users (name, lastName, email, password, role) VALUES (?, ?, ?, ?, ?)`,
      [name, lastName, email, hashedPassword, role],
      function (err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ message: 'User registered successfully' }); 
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});



// Logowanie użytkownika
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
          expiresIn: '1h',
        });
        res.json({ message: 'User logged in successfully', token });
      } else {
        res.status(400).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Weryfikacja tokena
router.get('/verifyToken', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Token received in verifyToken:', token); // Logowanie tokena na serwerze

  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Logowanie zdekodowanego tokena
    return res.status(200).json(decoded);
  } catch (error) {
    console.error('Invalid token:', error);
    return res.status(401).json({ message: 'Invalid token.' });
  }
});

router.get('/user/info', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  // Sprawdzenie, czy token istnieje
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    // Weryfikacja tokena
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Pobranie informacji o użytkowniku z bazy danych
    const userId = decoded.id;
    db.get(
      `SELECT name, lastName, email, role FROM users WHERE id = ?`, 
      [userId], 
      (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        if (!row) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Zwrócenie danych użytkownika, w tym roli
        res.status(200).json(row);
      }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token.' });
  }
});

/// front

// Endpoint to fetch doctor availability
router.get('/doctor/availability', (req, res) => {
  const { doctorId, startDate, endDate } = req.query;

  db.all(
    `SELECT * FROM doctor_availabilities WHERE doctor_id = ? AND 
      (start_date <= ? AND end_date >= ?)`,
    [doctorId, endDate, startDate],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Failed to fetch availability' });
      } else {
        res.json(rows);
      }
    }
  );
});

// Endpoint to fetch doctor consultations
router.get('/doctor/consultations', (req, res) => {
  const { doctorId, startDate, endDate } = req.query;

  db.all(
    `SELECT * FROM consultations
     WHERE doctor_id = ?
       AND date BETWEEN ? AND ?`,
    [doctorId, startDate, endDate],
    (err, rows) => {
      if (err) {
        console.error('Error fetching consultations:', err);
        res.status(500).json({ error: 'Server error' });
      } else {
        res.json(rows);
      }
    }
  );
  
});

// Endpoint to fetch doctor absences
router.get('/doctor/absences', (req, res) => {
  const { doctorId, startDate, endDate } = req.query;

  db.all(
    `SELECT date FROM doctor_absences WHERE doctor_id = ? AND 
      date BETWEEN ? AND ?`,
    [doctorId, startDate, endDate],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Failed to fetch absences' });
      } else {
        res.json(rows);
      }
    }
  );
});

// Endpoint to create a new consultation
router.post('/consultations', (req, res) => {
  const { doctor_id, patient_id, date, start_time, end_time, type, status, notes } = req.body;

  if (!doctor_id || !patient_id || !date || !start_time || !end_time || !type || !status) {
    return res.status(400).send('Missing required fields');
  }

  db.run(
    `
      INSERT INTO consultations (doctor_id, patient_id, date, start_time, end_time, type, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [doctor_id, patient_id, date, start_time, end_time, type, status, notes],
    function (err) {
      if (err) {
        console.error('Error inserting consultation:', err);
        return res.status(500).send('Failed to create consultation');
      }

      res.status(201).send({ id: this.lastID });
    }
  );
});

router.post('/availability', async (req, res) => {
  const { doctorId, startDate, endDate, daysMask, timeSlots, date, type } = req.body;

  try {
    if (type === 'Cyclic') {
      // Insert cyclic availability
      for (const slot of timeSlots) {
        await db.run(
          `INSERT INTO doctor_availabilities (doctor_id, start_date, end_date, days_mask, start_time, end_time, type)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [doctorId, startDate, endDate, daysMask, slot.start, slot.end, type]
        );
      }
    } else if (type === 'Single') {
      // Insert single availability
      for (const slot of timeSlots) {
        await db.run(
          `INSERT INTO doctor_availabilities (doctor_id, start_date, end_date, days_mask, start_time, end_time, type)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [doctorId, date, date, '', slot.start, slot.end, type]
        );
      }
    }

    res.status(200).send({ message: 'Availability saved successfully!' });
  } catch (error) {
    console.error('Error saving availability:', error);
    res.status(500).send({ error: 'Error saving availability' });
  }
});


module.exports = router;
