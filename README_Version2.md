# Loan Tracker Demo

A minimal Node.js + Express + SQLite app for tracking loans and line of credit for admins and users. Simple demo login: `admin/admin`, `user/user`.

## Features

- Admin creates loans for users (amount & interest rate)
- Users can withdraw, repay, and track their loan balance
- See all transactions and current balance
- Simple HTML frontend for both roles
- File-based SQLite DB (no setup needed)

---

## Local Run

1. **Install dependencies**
   ```
   npm install express sqlite3 body-parser
   ```

2. **Start the server**
   ```
   node server.js
   ```

3. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploy Online

### Render

1. **Create a new Web Service** on [https://render.com](https://render.com)
2. **Connect your repo** (or upload the above files)
3. Set `Start Command` to: `node server.js`

### Vercel

1. **Import project** at [https://vercel.com/import](https://vercel.com/import)
2. Make sure `server.js` is the entry point.
3. Configure the project as a Node.js serverless function.

---

## Demo Logins

- **Admin:**  
  Username: `admin`  
  Password: `admin`

- **User:**  
  Username: `user`  
  Password: `user`

---

## Notes

- This is a minimal demo. Not production secure.
- You can add more users to the `users` table in `db.js` or via the SQLite file.
- For custom domains, check your host's docs.
