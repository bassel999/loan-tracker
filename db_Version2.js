const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "db.sqlite";

let db = new sqlite3.Database(DBSOURCE);

module.exports = db;

module.exports.init = function () {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total_amount REAL,
      interest_rate REAL,
      balance REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER,
      type TEXT,
      amount REAL,
      description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Demo users
    db.run(`INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'admin', 'admin', 'admin')`);
    db.run(`INSERT OR IGNORE INTO users (id, username, password, role) VALUES (2, 'user', 'user', 'user')`);
  });
};