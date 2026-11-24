const pool = require('../config/db');
const handleError = require('../utils/handleError');
const isWarden = (req) => req.user.role === 'Warden';

async function ownsAllocation(req, allocation_id) {
  if (!isWarden(req)) return true;
  const [r] = await pool.query(
    `SELECT 1 FROM Allocation a JOIN Room r ON a.room_id = r.room_id JOIN Hostel h ON r.hostel_id = h.hostel_id
      WHERE a.allocation_id = ? AND h.warden_id = ?`, [allocation_id, req.user.warden_id]);
  return r.length > 0;
}

async function ownsPayment(req, payment_id) {
  if (!isWarden(req)) return true;
  const [r] = await pool.query(
    `SELECT 1 FROM Payment p JOIN Allocation a ON p.allocation_id = a.allocation_id
       JOIN Room r ON a.room_id = r.room_id JOIN Hostel h ON r.hostel_id = h.hostel_id
      WHERE p.payment_id = ? AND h.warden_id = ?`, [payment_id, req.user.warden_id]);
  return r.length > 0;
}

exports.getAll = async (req, res) => {
  try {
    let sql = `SELECT p.*, s.name AS student_name
                 FROM Payment p
                 JOIN Allocation a ON p.allocation_id = a.allocation_id
                 JOIN Student s ON a.student_id = s.student_id
                 JOIN Room r ON a.room_id = r.room_id
                 JOIN Hostel h ON r.hostel_id = h.hostel_id`;
    const params = [];
    if (isWarden(req)) { sql += ' WHERE h.warden_id = ?'; params.push(req.user.warden_id); }
    sql += ' ORDER BY p.payment_date DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.getByAllocation = async (req, res) => {
  try {
    if (!(await ownsAllocation(req, req.params.id))) return res.status(403).json({ message: 'Not allowed' });
    const [rows] = await pool.query('SELECT * FROM Payment WHERE allocation_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.create = async (req, res) => {
  const { allocation_id, amount, payment_mode, semester } = req.body;
  try {
    if (!(await ownsAllocation(req, allocation_id))) return res.status(403).json({ message: 'Not allowed' });
    const [result] = await pool.query(
      `INSERT INTO Payment (allocation_id, amount, payment_date, payment_mode, semester, status)
       VALUES (?, ?, CURDATE(), ?, ?, 'Paid')`, [allocation_id, amount, payment_mode, semester]);
    res.status(201).json({ message: 'Payment recorded', payment_id: result.insertId });
  } catch (err) { handleError(res, err); }
};

exports.update = async (req, res) => {
  const { amount, payment_mode, semester, status } = req.body;
  try {
    if (!(await ownsPayment(req, req.params.id))) return res.status(404).json({ message: 'Payment not found' });
    const [result] = await pool.query(
      'UPDATE Payment SET amount = ?, payment_mode = ?, semester = ?, status = ? WHERE payment_id = ?',
      [amount, payment_mode, semester, status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment updated' });
  } catch (err) { handleError(res, err); }
};

exports.remove = async (req, res) => {
  try {
    if (!(await ownsPayment(req, req.params.id))) return res.status(404).json({ message: 'Payment not found' });
    const [result] = await pool.query('DELETE FROM Payment WHERE payment_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) { handleError(res, err); }
};