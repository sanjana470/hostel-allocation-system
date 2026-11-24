const pool = require('../config/db');
const handleError = require('../utils/handleError');
const isWarden = (req) => req.user.role === 'Warden';

// A warden may only use their own students and their own rooms
async function canUse(req, student_id, room_id) {
  if (!isWarden(req)) return true;
  if (student_id) {
    const [s] = await pool.query('SELECT 1 FROM Student WHERE student_id = ? AND owner_warden_id = ?', [student_id, req.user.warden_id]);
    if (s.length === 0) return false;
  }
  if (room_id) {
    const [r] = await pool.query(
      'SELECT 1 FROM Room r JOIN Hostel h ON r.hostel_id = h.hostel_id WHERE r.room_id = ? AND h.warden_id = ?',
      [room_id, req.user.warden_id]);
    if (r.length === 0) return false;
  }
  return true;
}

// A rule error is a normal "you can't do that" message, not a crash
function ruleError(message) {
  const e = new Error(message);
  e.isRule = true;
  return e;
}

// Replaces the old MySQL trigger + allocate_room procedure
async function doAllocate(conn, student_id, room_id) {
  const [s] = await conn.query('SELECT gender FROM Student WHERE student_id = ?', [student_id]);
  if (s.length === 0) throw ruleError('Student not found');

  const [r] = await conn.query(
    `SELECT h.type, r.capacity, r.occupied_count, r.status
       FROM Room r JOIN Hostel h ON r.hostel_id = h.hostel_id
      WHERE r.room_id = ? FOR UPDATE`, [room_id]);
  if (r.length === 0) throw ruleError('Room not found');

  const gender = s[0].gender;
  const { type, capacity, occupied_count, status } = r[0];

  if (status === 'Maintenance') throw ruleError('Room is under maintenance');
  if ((gender === 'M' && type !== 'Boys') || (gender === 'F' && type !== 'Girls')) {
    throw ruleError('Student gender does not match hostel type');
  }
  if (occupied_count >= capacity) throw ruleError('Room is already full');

  await conn.query(
    'INSERT INTO Allocation (student_id, room_id, allocation_date) VALUES (?, ?, CURDATE())',
    [student_id, room_id]);

  const newCount = occupied_count + 1;
  await conn.query('UPDATE Room SET occupied_count = ?, status = ? WHERE room_id = ?',
    [newCount, newCount >= capacity ? 'Full' : 'Available', room_id]);
}

// Replaces the old MySQL trigger + deallocate_room procedure
async function doVacate(conn, student_id) {
  const [a] = await conn.query(
    "SELECT allocation_id, room_id FROM Allocation WHERE student_id = ? AND status = 'Active' LIMIT 1 FOR UPDATE",
    [student_id]);
  if (a.length === 0) throw ruleError('Student has no active allocation');

  await conn.query(
    "UPDATE Allocation SET status = 'Vacated', checkout_date = CURDATE() WHERE allocation_id = ?",
    [a[0].allocation_id]);
  await conn.query(
    "UPDATE Room SET occupied_count = occupied_count - 1, status = 'Available' WHERE room_id = ?",
    [a[0].room_id]);
  return a[0];
}

exports.getActive = async (req, res) => {
  try {
    let sql = `SELECT v.* FROM vw_active_allocations v
                 JOIN Allocation a ON v.allocation_id = a.allocation_id
                 JOIN Room r ON a.room_id = r.room_id
                 JOIN Hostel h ON r.hostel_id = h.hostel_id`;
    const params = [];
    if (isWarden(req)) { sql += ' WHERE h.warden_id = ?'; params.push(req.user.warden_id); }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.getStudentHistory = async (req, res) => {
  try {
    if (!(await canUse(req, req.params.id, null))) return res.status(403).json({ message: 'Not your student' });
    const [rows] = await pool.query(
      `SELECT a.allocation_id, h.hostel_name, r.room_number, a.allocation_date, a.checkout_date, a.status
         FROM Allocation a JOIN Room r ON a.room_id = r.room_id JOIN Hostel h ON r.hostel_id = h.hostel_id
        WHERE a.student_id = ? ORDER BY a.allocation_date`, [req.params.id]);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.allocate = async (req, res) => {
  const { student_id, room_id } = req.body;
  let conn;
  try {
    if (!(await canUse(req, student_id, room_id))) return res.status(403).json({ message: 'Not allowed for this student or room' });
    conn = await pool.getConnection();
    await conn.beginTransaction();
    await doAllocate(conn, student_id, room_id);
    await conn.commit();
    res.status(201).json({ message: 'Room allocated successfully' });
  } catch (err) {
    if (conn) await conn.rollback();
    if (err.isRule) return res.status(400).json({ message: err.message });
    handleError(res, err);
  } finally { if (conn) conn.release(); }
};

exports.deallocate = async (req, res) => {
  const { student_id } = req.body;
  let conn;
  try {
    if (!(await canUse(req, student_id, null))) return res.status(403).json({ message: 'Not your student' });
    conn = await pool.getConnection();
    await conn.beginTransaction();
    await doVacate(conn, student_id);
    await conn.commit();
    res.json({ message: 'Room vacated successfully' });
  } catch (err) {
    if (conn) await conn.rollback();
    if (err.isRule) return res.status(400).json({ message: err.message });
    handleError(res, err);
  } finally { if (conn) conn.release(); }
};

exports.getMine = async (req, res) => {
  try {
    const sid = req.user.student_id;
    if (!sid) return res.json({ current: null, history: [], payments: [] });
    const [current] = await pool.query(
      `SELECT a.allocation_id, h.hostel_name, r.room_number, r.floor, r.fee_per_semester, a.allocation_date
         FROM Allocation a JOIN Room r ON a.room_id = r.room_id JOIN Hostel h ON r.hostel_id = h.hostel_id
        WHERE a.student_id = ? AND a.status = 'Active'`, [sid]);
    const [history] = await pool.query(
      `SELECT h.hostel_name, r.room_number, a.allocation_date, a.checkout_date, a.status
         FROM Allocation a JOIN Room r ON a.room_id = r.room_id JOIN Hostel h ON r.hostel_id = h.hostel_id
        WHERE a.student_id = ? ORDER BY a.allocation_date`, [sid]);
    const [payments] = await pool.query(
      `SELECT p.amount, p.payment_date, p.payment_mode, p.semester, p.status
         FROM Payment p JOIN Allocation a ON p.allocation_id = a.allocation_id
        WHERE a.student_id = ? ORDER BY p.payment_date DESC`, [sid]);
    res.json({ current: current[0] || null, history, payments });
  } catch (err) { handleError(res, err); }
};

exports.getHistory = async (req, res) => {
  try {
    let sql = `SELECT a.allocation_id, s.name AS student_name, h.hostel_name, r.room_number,
                      a.allocation_date, a.checkout_date, a.status
                 FROM Allocation a
                 JOIN Student s ON a.student_id = s.student_id
                 JOIN Room r ON a.room_id = r.room_id
                 JOIN Hostel h ON r.hostel_id = h.hostel_id`;
    const params = [];
    if (isWarden(req)) { sql += ' WHERE h.warden_id = ?'; params.push(req.user.warden_id); }
    sql += ' ORDER BY a.allocation_id DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.transfer = async (req, res) => {
  const { student_id, room_id } = req.body;
  let conn;
  try {
    if (!(await canUse(req, student_id, room_id))) return res.status(403).json({ message: 'Not allowed for this student or room' });
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [a] = await conn.query(
      "SELECT allocation_id, room_id FROM Allocation WHERE student_id = ? AND status = 'Active' FOR UPDATE", [student_id]);
    if (a.length === 0) { await conn.rollback(); return res.status(400).json({ message: 'Student has no active allocation' }); }
    if (String(a[0].room_id) === String(room_id)) { await conn.rollback(); return res.status(400).json({ message: 'Student is already in this room' }); }
    await doVacate(conn, student_id);
    await doAllocate(conn, student_id, room_id);
    await conn.commit();
    res.json({ message: 'Student transferred successfully' });
  } catch (err) {
    if (conn) await conn.rollback();
    if (err.isRule) return res.status(400).json({ message: err.message });
    handleError(res, err);
  } finally { if (conn) conn.release(); }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.status, h.warden_id FROM Allocation a
         JOIN Room r ON a.room_id = r.room_id JOIN Hostel h ON r.hostel_id = h.hostel_id
        WHERE a.allocation_id = ?`, [req.params.id]);
    if (rows.length === 0 || (isWarden(req) && rows[0].warden_id !== req.user.warden_id)) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    if (rows[0].status === 'Active') return res.status(400).json({ message: 'Vacate the student first, then delete the record' });
    await pool.query('DELETE FROM Allocation WHERE allocation_id = ?', [req.params.id]);
    res.json({ message: 'Allocation record deleted' });
  } catch (err) { handleError(res, err); }
};