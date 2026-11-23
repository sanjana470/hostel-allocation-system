const pool = require('../config/db');
const handleError = require('../utils/handleError');

exports.getAll = async (req, res) => {
  try {
    let sql = `SELECT r.*, h.hostel_name, h.type AS hostel_type
               FROM Room r JOIN Hostel h ON r.hostel_id = h.hostel_id`;
    const params = [];
    if (req.query.hostel_id) { sql += ' WHERE r.hostel_id = ?'; params.push(req.query.hostel_id); }
    sql += ' ORDER BY r.hostel_id, r.room_number';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.getVacant = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vw_vacant_rooms');
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.create = async (req, res) => {
  const { hostel_id, room_number, floor, capacity, fee_per_semester } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Room (hostel_id, room_number, floor, capacity, fee_per_semester) VALUES (?, ?, ?, ?, ?)',
      [hostel_id, room_number, floor, capacity, fee_per_semester]
    );
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
      `UPDATE Room
          SET status = IF(? = 'Available' AND occupied_count >= capacity, 'Full', ?)
        WHERE room_id = ?`,
      [status, status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room status updated' });
  } catch (err) { handleError(res, err); }
};

// UPDATE room details (capacity cannot go below current occupancy)
exports.update = async (req, res) => {
  const { room_number, floor, capacity, fee_per_semester } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE Room
          SET room_number = ?, floor = ?, capacity = ?, fee_per_semester = ?,
              status = IF(status = 'Maintenance', 'Maintenance',
                          IF(occupied_count >= ?, 'Full', 'Available'))
        WHERE room_id = ?`,
      [room_number, floor, capacity, fee_per_semester, capacity, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room updated' });
  } catch (err) { handleError(res, err); }
};

// DELETE (blocked if the room has allocation history)
exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Room WHERE room_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) { handleError(res, err); }
};