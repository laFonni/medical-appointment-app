const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./medicalAppDB.sqlite');

const User = {};

User.createUser = async function({ name, lastName, email, password, role }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO users (name, lastName, email, password, role) VALUES (?, ?, ?, ?, ?)`, [name, lastName, email, hashedPassword, role], function(err) {
            if (err) {
                reject(err);
            } else {
                const userId = this.lastID;
                if (role === 'doctor') {
                    db.run(`INSERT INTO doctors (id, firstName, lastName, email) VALUES (?, ?, ?, ?)`, [userId, name, lastName, email], (err) => {
                        if (err) reject(err);
                    });
                } else if (role === 'patient') {
                    db.run(`INSERT INTO patients (id, firstName, lastName, email) VALUES (?, ?, ?, ?)`, [userId, name, lastName, email], (err) => {
                        if (err) reject(err);
                    });
                }
                resolve({ id: userId });
            }
        });
    });
};

User.findUserByEmail = function(email) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
            if (err) {
                reject(err);
            } else {
                resolve(user);
            }
        });
    });
};

User.findUserById = function(userId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT name, lastName, email, role FROM users WHERE id = ?`, [userId], (err, user) => {
            if (err) {
                reject(err);
            } else if (!user) {
                reject(new Error('User not found'));
            } else {
                resolve(user);
            }
        });
    });
};

User.comparePassword = async function(candidatePassword, hash) {
    return bcrypt.compare(candidatePassword, hash);
};

module.exports = User;
