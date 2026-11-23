require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

(async () => {
   const users = [
  ['admin', 'MyAdmin@123']
];
  for (const [username, password] of users) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE Users SET password_hash = ? WHERE username = ?', [hash, username]);
    console.log('Password set for', username);
  }
  process.exit();
})();