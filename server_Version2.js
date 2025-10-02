const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Simple in-memory sessions for demo (not secure)
let sessions = {};

// Demo users (in production, use real authentication!)
const USERS = [
  { id: 1, username: 'admin', password: 'admin', role: 'admin' },
  { id: 2, username: 'user', password: 'user', role: 'user' }
];

// --- Authentication ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = Math.random().toString(36).slice(2);
  sessions[token] = user;
  res.json({ token, role: user.role, userId: user.id });
});

function requireAuth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token || !sessions[token]) return res.status(401).json({ error: 'Unauthorized' });
  req.user = sessions[token];
  next();
}

// --- Admin: Create Loan ---
app.post('/api/loans', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { userId, totalAmount, interestRate } = req.body;
  db.run(
    `INSERT INTO loans (user_id, total_amount, interest_rate, balance) VALUES (?, ?, ?, 0)`,
    [userId, totalAmount, interestRate],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ loanId: this.lastID });
    }
  );
});

// --- Admin: List all loans ---
app.get('/api/loans', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.all(
    `SELECT loans.*, users.username FROM loans JOIN users ON loans.user_id = users.id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// --- User: List my loans ---
app.get('/api/myloans', requireAuth, (req, res) => {
  db.all(
    `SELECT * FROM loans WHERE user_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// --- Withdraw money ---
app.post('/api/loans/:loanId/withdraw', requireAuth, (req, res) => {
  const { amount } = req.body;
  const loanId = req.params.loanId;
  // Check loan and limit
  db.get(`SELECT * FROM loans WHERE id = ? AND user_id = ?`, [loanId, req.user.id], (err, loan) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    const withdrawn = loan.balance + Number(amount);
    if (withdrawn > loan.total_amount) {
      return res.status(400).json({ error: 'Exceeds credit limit' });
    }
    db.run(`UPDATE loans SET balance = balance + ? WHERE id = ?`, [amount, loanId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.run(
        `INSERT INTO transactions (loan_id, type, amount, description) VALUES (?, 'withdrawal', ?, ?)`,
        [loanId, amount, 'Withdrawal'],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        }
      );
    });
  });
});

// --- Repay money ---
app.post('/api/loans/:loanId/repay', requireAuth, (req, res) => {
  const { amount } = req.body;
  const loanId = req.params.loanId;
  db.get(`SELECT * FROM loans WHERE id = ? AND user_id = ?`, [loanId, req.user.id], (err, loan) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    db.run(`UPDATE loans SET balance = balance - ? WHERE id = ?`, [amount, loanId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.run(
        `INSERT INTO transactions (loan_id, type, amount, description) VALUES (?, 'repayment', ?, ?)`,
        [loanId, amount, 'Repayment'],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        }
      );
    });
  });
});

// --- Get loan details and transactions ---
app.get('/api/loans/:loanId', requireAuth, (req, res) => {
  const loanId = req.params.loanId;
  db.get(`SELECT * FROM loans WHERE id = ? AND user_id = ?`, [loanId, req.user.id], (err, loan) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    db.all(`SELECT * FROM transactions WHERE loan_id = ? ORDER BY timestamp DESC`, [loanId], (err, txs) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ loan, transactions: txs });
    });
  });
});

// --- User and admin listing (for demo UI) ---
app.get('/api/demo-users', (req, res) => {
  db.all(`SELECT id, username, role FROM users`, [], (err, rows) => {
    res.json(rows);
  });
});

// --- Serve frontend ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start server ---
app.listen(PORT, () => {
  db.init();
  console.log(`Server running on port ${PORT}`);
});