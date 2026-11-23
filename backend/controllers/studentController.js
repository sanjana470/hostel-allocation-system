const pool = require('../config/db');
const handleError = require('../utils/handleError');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Student ORDER BY student_id');
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Student WHERE student_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (err) { handleError(res, err); }
};

exports.create = async (req, res) => {
  const { name, gender, dob, phone, email, course, year, address, guardian_name, guardian_phone } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO Student (name, gender, dob, phone, email, course, year, address, guardian_name, guardian_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, gender, dob, phone, email, course, year, address, guardian_name, guardian_phone]
    );
    res.status(201).json({ message: 'Student registered', student_id: result.insertId });
  } catch (err) { handleError(res, err); }
};

exports.update = async (req, res) => {
  const { name, phone, email, course, year, address, guardian_name, guardian_phone } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE Student SET name=?, phone=?, email=?, course=?, year=?, address=?,
              guardian_name=?, guardian_phone=? WHERE student_id=?`,
      [name, phone, email, course, year, address, guardian_name, guardian_phone, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student updated' });
  } catch (err) { handleError(res, err); }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Student WHERE student_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) { handleError(res, err); }
};