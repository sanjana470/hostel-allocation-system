const pool = require('../config/db');
const handleError = require('../utils/handleError');
const isWarden = (req) => req.user.role === 'Warden';

exports.getAll = async (req, res) => {
  try {
    let sql = 'SELECT * FROM Student';
    const params = [];
    if (isWarden(req)) { sql += ' WHERE owner_warden_id = ?'; params.push(req.user.warden_id); }
    sql += ' ORDER BY student_id';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.getOne = async (req, res) => {
  try {
    let sql = 'SELECT * FROM Student WHERE student_id = ?';
    const params = [req.params.id];
    if (isWarden(req)) { sql += ' AND owner_warden_id = ?'; params.push(req.user.warden_id); }
    const [rows] = await pool.query(sql, params);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (err) { handleError(res, err); }
};

exports.create = async (req, res) => {
  const { name, gender, dob, phone, email, course, year, address, guardian_name, guardian_phone } = req.body;
  const owner = isWarden(req) ? req.user.warden_id : null;
  try {
    const [result] = await pool.query(
      `INSERT INTO Student (name, gender, dob, phone, email, course, year, address, guardian_name, guardian_phone, owner_warden_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, gender, dob, phone, email, course, year, address, guardian_name, guardian_phone, owner]);
    res.status(201).json({ message: 'Student registered', student_id: result.insertId });
  } catch (err) { handleError(res, err); }
};

exports.update = async (req, res) => {
  const { name, phone, email, course, year, address, guardian_name, guardian_phone } = req.body;
  try {
    let sql = `UPDATE Student SET name=?, phone=?, email=?, course=?, year=?, address=?,
               guardian_name=?, guardian_phone=? WHERE student_id=?`;
    const params = [name, phone, email, course, year, address, guardian_name, guardian_phone, req.params.id];
    if (isWarden(req)) { sql += ' AND owner_warden_id = ?'; params.push(req.user.warden_id); }
    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student updated' });
  } catch (err) { handleError(res, err); }
};

exports.remove = async (req, res) => {
  try {
    let sql = 'DELETE FROM Student WHERE student_id = ?';
    const params = [req.params.id];
    if (isWarden(req)) { sql += ' AND owner_warden_id = ?'; params.push(req.user.warden_id); }
    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) { handleError(res, err); }
};