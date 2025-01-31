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

router.get("/patient/consultations", async (req, res) => {
  const { patientId } = req.query;

  if (!patientId) {
    return res.status(400).json({ error: "patientId is required" });
  }

  db.all(
    `SELECT id, doctor_id, date, start_time, end_time, type, status, notes 
       FROM consultations 
       WHERE patient_id = ? 
       ORDER BY date, start_time`,
      [patientId],
      (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Failed to fetch absences' });
      } else {
        res.json(rows);
      }
    }
  );

});


// Endpoint to fetch doctor absences
router.get('/doctor/absences', async (req, res) => {
  const { doctorId, startDate, endDate } = req.query;

  if (!doctorId || !startDate || !endDate) {
    return res.status(400).json({ error: "doctorId, startDate, and endDate are required" });
  }

  db.all(
    `SELECT id, start_date, end_date, reason 
       FROM doctor_absences 
       WHERE doctor_id = ? 
       AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?) OR (start_date <= ? AND end_date >= ?))`,
      [doctorId, startDate, endDate, startDate, endDate, startDate, endDate],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Failed to fetch absences' });
      } else {
        res.json(rows);
      }
    }
  );

});


router.get('/doctor/all-absences', async (req, res) => {
  const { doctorId } = req.query;

  if (!doctorId) {
    return res.status(400).json({ error: "doctorId is required" });
  }

  db.all(
    'SELECT id, start_date, end_date, reason FROM doctor_absences WHERE doctor_id = ?',
      [parseInt(doctorId, 10)],
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

router.post('/absences', async (req, res) => {
  const { doctorId, startDate, endDate, reason } = req.body;

  if (!doctorId || !startDate || !endDate) {
    return res.status(400).send({ error: "doctorId, startDate, and endDate are required" });
  }

  try {
    await db.run(
      `INSERT INTO doctor_absences (doctor_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)`,
      [doctorId, startDate, endDate, reason || null]
    );

    res.status(201).send({ message: "Absence recorded successfully!" });
  } catch (error) {
    console.error("Error saving absence:", error);
    res.status(500).send({ error: "Error saving absence" });
  }
});


router.delete('/absences/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Absence ID is required" });
  }

  try {
    const result = await db.run(`DELETE FROM doctor_absences WHERE id = ?`, [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Absence not found" });
    }

    res.json({ message: "Absence deleted successfully" });
  } catch (error) {
    console.error("Error deleting absence:", error);
    res.status(500).json({ error: "Failed to delete absence" });
  }
});


router.delete("/consultations/:id", async (req, res) => {
  const { id } = req.params;
  const { patient_id } = req.body; // Ensure the patient is cancelling their own consultation

  try {
    // Verify the consultation belongs to the patient
    const consultation = await db.get(
      "SELECT * FROM consultations WHERE id = ? AND patient_id = ?",
      [id, patient_id]
    );

    if (!consultation) {
      return res.status(403).json({ error: "Unauthorized or consultation not found" });
    }

    await db.run("DELETE FROM consultations WHERE id = ?", [id]);
    res.json({ message: "Consultation canceled successfully" });
  } catch (error) {
    console.error("Error canceling consultation:", error);
    res.status(500).json({ error: "Failed to cancel consultation" });
  }
});

router.post("/patient/checkout", async (req, res) => {
  const { patientID } = req.body;

  if (!patientID) {
    return res.status(400).json({ error: "patientID is required" });
  }

  try {
    await db.run(
      `UPDATE consultations SET status = 'Paid' WHERE patient_id = ? AND status = 'Booked'`,
      [patientID]
    );

    res.status(200).json({ message: "Checkout successful. All consultations are now paid." });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({ error: "Failed to process checkout." });
  }
});


router.get("/doctors", (req, res) => {
  db.all(
    `SELECT id, name, lastName FROM users WHERE role = 'Doctor' ORDER BY lastName`,
    [],
    (err, doctors) => {
      if (err) {
        console.error("Error fetching doctors:", err);
        return res.status(500).json({ error: "Failed to fetch doctors" });
      }
      res.json(doctors || []); // Ensure it always returns an array
    }
  );
});


// Get all users (Admin only)
router.get("/users", (req, res) => {
  db.all("SELECT id, name, lastName, email, role FROM users", [], (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(rows || []);
  });
});

// Update user role (Admin only)
router.patch("/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["Patient", "Doctor", "Admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  db.run("UPDATE users SET role = ? WHERE id = ?", [role, id], function (err) {
    if (err) {
      console.error("Error updating user role:", err);
      return res.status(500).json({ error: "Failed to update role" });
    }
    res.json({ success: true, updatedRows: this.changes });
  });
});

module.exports = router;
