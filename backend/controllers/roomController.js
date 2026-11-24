const pool = require('../config/db');
const handleError = require('../utils/handleError');
const isWarden = (req) => req.user.role === 'Warden';

async function ownsHostel(req, hostel_id) {
  if (!isWarden(req)) return true;
  const [r] = await pool.query('SELECT 1 FROM Hostel WHERE hostel_id = ? AND warden_id = ?', [hostel_id, req.user.warden_id]);
  return r.length > 0;
}

exports.getAll = async (req, res) => {
  try {
    let sql = `SELECT r.*, h.hostel_name, h.type AS hostel_type
                 FROM Room r JOIN Hostel h ON r.hostel_id = h.hostel_id WHERE 1=1`;
    const params = [];
    if (isWarden(req)) { sql += ' AND h.warden_id = ?'; params.push(req.user.warden_id); }
    if (req.query.hostel_id) { sql += ' AND r.hostel_id = ?'; params.push(req.query.hostel_id); }
    sql += ' ORDER BY r.hostel_id, r.room_number';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.getVacant = async (req, res) => {
  try {
    let sql = `SELECT v.* FROM vw_vacant_rooms v
                 JOIN Room r ON v.room_id = r.room_id
                 JOIN Hostel h ON r.hostel_id = h.hostel_id`;
    const params = [];
    if (isWarden(req)) { sql += ' WHERE h.warden_id = ?'; params.push(req.user.warden_id); }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.create = async (req, res) => {
  const { hostel_id, room_number, floor, capacity, fee_per_semester } = req.body;
  try {
    if (!(await ownsHostel(req, hostel_id))) return res.status(403).json({ message: 'Not your hostel' });
    const [result] = await pool.query(
      'INSERT INTO Room (hostel_id, room_number, floor, capacity, fee_per_semester) VALUES (?, ?, ?, ?, ?)',
      [hostel_id, room_number, floor, capacity, fee_per_semester]);
    res.status(201).json({ message: 'Room added', room_id: result.insertId });
  } catch (err) { handleError(res, err); }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['Available', 'Maintenance'].includes(status)) {
    return res.status(400).json({ message: 'Status must be Available or Maintenance' });
  }
  try {
    const [result] = await pool.query(
      `UPDATE Room r JOIN Hostel h ON r.hostel_id = h.hostel_id
          SET r.status = IF(? = 'Available' AND r.occupied_count >= r.capacity, 'Full', ?)
        WHERE r.room_id = ? AND (? = 'Admin' OR h.warden_id = ?)`,
      [status, status, req.params.id, req.user.role, req.user.warden_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room status updated' });
  } catch (err) { handleError(res, err); }
};

exports.update = async (req, res) => {
  const { room_number, floor, capacity, fee_per_semester } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE Room r JOIN Hostel h ON r.hostel_id = h.hostel_id
          SET r.room_number = ?, r.floor = ?, r.capacity = ?, r.fee_per_semester = ?,
              r.status = IF(r.status = 'Maintenance', 'Maintenance',
                            IF(r.occupied_count >= ?, 'Full', 'Available'))
        WHERE r.room_id = ? AND (? = 'Admin' OR h.warden_id = ?)`,
      [room_number, floor, capacity, fee_per_semester, capacity, req.params.id, req.user.role, req.user.warden_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room updated' });
  } catch (err) { handleError(res, err); }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE r FROM Room r JOIN Hostel h ON r.hostel_id = h.hostel_id
        WHERE r.room_id = ? AND (? = 'Admin' OR h.warden_id = ?)`,
      [req.params.id, req.user.role, req.user.warden_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) { handleError(res, err); }
};