const pool = require('../config/db');
const handleError = require('../utils/handleError');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.name AS student_name
         FROM Payment p
         JOIN Allocation a ON p.allocation_id = a.allocation_id
         JOIN Student s ON a.student_id = s.student_id
        ORDER BY p.payment_date DESC`
    );
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.getByAllocation = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Payment WHERE allocation_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.create = async (req, res) => {
  const { allocation_id, amount, payment_mode, semester } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO Payment (allocation_id, amount, payment_date, payment_mode, semester, status)
       VALUES (?, ?, CURDATE(), ?, ?, 'Paid')`,
      [allocation_id, amount, payment_mode, semester]
    );
    res.status(201).json({ message: 'Payment recorded', payment_id: result.insertId });
  } catch (err) { handleError(res, err); }
};

exports.update = async (req, res) => {
  const { amount, payment_mode, semester, status } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE Payment SET amount = ?, payment_mode = ?, semester = ?, status = ? WHERE payment_id = ?',
      [amount, payment_mode, semester, status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment updated' });
  } catch (err) { handleError(res, err); }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Payment WHERE payment_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) { handleError(res, err); }
};