const pool = require('../config/db');
const handleError = require('../utils/handleError');

const isWarden = (req) => req.user.role === 'Warden';

exports.getAll = async (req, res) => {
  try {
    let sql = `SELECT v.*, h.total_floors, h.warden_id
                 FROM vw_hostel_occupancy v
                 JOIN Hostel h ON v.hostel_id = h.hostel_id`;
    const params = [];
    if (isWarden(req)) { sql += ' WHERE h.warden_id = ?'; params.push(req.user.warden_id); }
    sql += ' ORDER BY v.hostel_id';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.create = async (req, res) => {
  const { hostel_name, type, total_floors } = req.body;
  const warden_id = isWarden(req) ? req.user.warden_id : req.body.warden_id;
  try {
    const [result] = await pool.query(
      'INSERT INTO Hostel (hostel_name, type, total_floors, warden_id) VALUES (?, ?, ?, ?)',
      [hostel_name, type, total_floors, warden_id]
    );
    res.status(201).json({ message: 'Hostel added', hostel_id: result.insertId });
  } catch (err) { handleError(res, err); }
};

exports.update = async (req, res) => {
  const { hostel_name, total_floors } = req.body;
  try {
    let sql = 'UPDATE Hostel SET hostel_name = ?, total_floors = ?';
    const params = [hostel_name, total_floors];
    if (!isWarden(req)) { sql += ', warden_id = ?'; params.push(req.body.warden_id); }
    sql += ' WHERE hostel_id = ?'; params.push(req.params.id);
    if (isWarden(req)) { sql += ' AND warden_id = ?'; params.push(req.user.warden_id); }
    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Hostel not found' });
    res.json({ message: 'Hostel updated' });
  } catch (err) { handleError(res, err); }
};

exports.remove = async (req, res) => {
  try {
    let sql = 'DELETE FROM Hostel WHERE hostel_id = ?';
    const params = [req.params.id];
    if (isWarden(req)) { sql += ' AND warden_id = ?'; params.push(req.user.warden_id); }
    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Hostel not found' });
    res.json({ message: 'Hostel deleted' });
  } catch (err) { handleError(res, err); }
};