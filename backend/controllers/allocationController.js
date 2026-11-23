const pool = require('../config/db');
const handleError = require('../utils/handleError');

exports.getActive = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vw_active_allocations');
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.getStudentHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.allocation_id, h.hostel_name, r.room_number,
              a.allocation_date, a.checkout_date, a.status
         FROM Allocation a
         JOIN Room r ON a.room_id = r.room_id
         JOIN Hostel h ON r.hostel_id = h.hostel_id
        WHERE a.student_id = ?
        ORDER BY a.allocation_date`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.allocate = async (req, res) => {
  const { student_id, room_id } = req.body;
  try {
    await pool.query('CALL allocate_room(?, ?)', [student_id, room_id]);
    res.status(201).json({ message: 'Room allocated successfully' });
  } catch (err) { handleError(res, err); }
};

exports.deallocate = async (req, res) => {
  const { student_id } = req.body;
  try {
    await pool.query('CALL deallocate_room(?)', [student_id]);
    res.json({ message: 'Room vacated successfully' });
  } catch (err) { handleError(res, err); }
};

// Student's own data (uses student_id stored in the login token)
exports.getMine = async (req, res) => {
  try {
    const sid = req.user.student_id;
    if (!sid) return res.status(400).json({ message: 'Not a student account' });

    const [current] = await pool.query(
      `SELECT a.allocation_id, h.hostel_name, r.room_number, r.floor,
              r.fee_per_semester, a.allocation_date
         FROM Allocation a
         JOIN Room r ON a.room_id = r.room_id
         JOIN Hostel h ON r.hostel_id = h.hostel_id
        WHERE a.student_id = ? AND a.status = 'Active'`, [sid]);

    const [history] = await pool.query(
      `SELECT h.hostel_name, r.room_number, a.allocation_date, a.checkout_date, a.status
         FROM Allocation a
         JOIN Room r ON a.room_id = r.room_id
         JOIN Hostel h ON r.hostel_id = h.hostel_id
        WHERE a.student_id = ? ORDER BY a.allocation_date`, [sid]);

    const [payments] = await pool.query(
      `SELECT p.amount, p.payment_date, p.payment_mode, p.semester, p.status
         FROM Payment p
         JOIN Allocation a ON p.allocation_id = a.allocation_id
        WHERE a.student_id = ? ORDER BY p.payment_date DESC`, [sid]);

    res.json({ current: current[0] || null, history, payments });
  } catch (err) { handleError(res, err); }
};

// All allocations including vacated ones
exports.getHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.allocation_id, s.name AS student_name, h.hostel_name, r.room_number,
              a.allocation_date, a.checkout_date, a.status
         FROM Allocation a
         JOIN Student s ON a.student_id = s.student_id
         JOIN Room r ON a.room_id = r.room_id
         JOIN Hostel h ON r.hostel_id = h.hostel_id
        ORDER BY a.allocation_id DESC`);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

// Transfer: vacate current room and allocate a new one in one transaction
exports.transfer = async (req, res) => {
  const { student_id, room_id } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [a] = await conn.query(
      "SELECT allocation_id, room_id FROM Allocation WHERE student_id = ? AND status = 'Active' FOR UPDATE",
      [student_id]);
    if (a.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Student has no active allocation' });
    }
    if (String(a[0].room_id) === String(room_id)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Student is already in this room' });
    }
    await conn.query(
      "UPDATE Allocation SET status = 'Vacated', checkout_date = CURDATE() WHERE allocation_id = ?",
      [a[0].allocation_id]);
    await conn.query(
      'INSERT INTO Allocation (student_id, room_id, allocation_date) VALUES (?, ?, CURDATE())',
      [student_id, room_id]);
    await conn.commit();
    res.json({ message: 'Student transferred successfully' });
  } catch (err) {
    await conn.rollback();
    handleError(res, err);
  } finally { conn.release(); }
};

// Delete an old (vacated) allocation record
exports.remove = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT status FROM Allocation WHERE allocation_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Allocation not found' });
    if (rows[0].status === 'Active') {
      return res.status(400).json({ message: 'Vacate the student first, then delete the record' });
    }
    await pool.query('DELETE FROM Allocation WHERE allocation_id = ?', [req.params.id]);
    res.json({ message: 'Allocation record deleted' });
  } catch (err) { handleError(res, err); }
};