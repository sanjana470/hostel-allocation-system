
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const handleError = require('../utils/handleError');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM Users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid username or password' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid username or password' });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, student_id: user.student_id, warden_id: user.warden_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, role: user.role, username: user.username, student_id: user.student_id });
  } catch (err) { handleError(res, err); }
};

exports.signup = async (req, res) => {
  const { role = 'Student', name, email, phone, username, password, access_code,
          hostel_name, hostel_type, total_floors } = req.body;

  if (!['Student', 'Warden', 'Admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
   if (!name || !email || !username || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, phone, username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  if (role === 'Admin' && access_code !== process.env.ADMIN_CODE) {
    return res.status(403).json({ message: 'Invalid admin access code' });
  }
  if (role === 'Warden' && (!phone || !hostel_name || !hostel_type || !total_floors)) {
    return res.status(400).json({ message: 'Phone, hostel name, hostel type and floors are required for a warden' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    if (role === 'Student') {
      const [s] = await pool.query('SELECT student_id FROM Student WHERE email = ?', [email]);
      const studentId = s.length ? s[0].student_id : null;
      if (studentId) {
        const [ex] = await pool.query('SELECT user_id FROM Users WHERE student_id = ?', [studentId]);
        if (ex.length) return res.status(409).json({ message: 'An account already exists for this email' });
      }
      await pool.query(
        "INSERT INTO Users (username, password_hash, role, student_id) VALUES (?, ?, 'Student', ?)",
        [username, hash, studentId]);
    }

    if (role === 'Warden') {
      const [w] = await pool.query('SELECT warden_id FROM Warden WHERE email = ?', [email]);
      let wardenId;
      if (w.length) {
        wardenId = w[0].warden_id;
        const [ex] = await pool.query('SELECT user_id FROM Users WHERE warden_id = ?', [wardenId]);
        if (ex.length) return res.status(409).json({ message: 'An account already exists for this warden' });
      } else {
        const [r] = await pool.query(
          'INSERT INTO Warden (name, phone, email) VALUES (?, ?, ?)', [name, phone, email]);
        wardenId = r.insertId;
      }
      await pool.query(
        "INSERT INTO Users (username, password_hash, role, warden_id) VALUES (?, ?, 'Warden', ?)",
        [username, hash, wardenId]);
      // Create this warden's hostel automatically
      await pool.query(
        'INSERT INTO Hostel (hostel_name, type, total_floors, warden_id) VALUES (?, ?, ?, ?)',
        [hostel_name, hostel_type, total_floors, wardenId]);
    }

    if (role === 'Admin') {
      await pool.query(
        "INSERT INTO Users (username, password_hash, role) VALUES (?, ?, 'Admin')",
        [username, hash]);
    }
    await pool.query('UPDATE Users SET phone = ? WHERE username = ?', [phone, username]);
    res.status(201).json({ message: 'Account created. You can now log in.' });
  } catch (err) { handleError(res, err); }
};
