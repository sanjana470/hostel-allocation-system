const pool = require('../config/db');
const handleError = require('../utils/handleError');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vw_hostel_occupancy');
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.create = async (req, res) => {
  const { hostel_name, type, total_floors, warden_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Hostel (hostel_name, type, total_floors, warden_id) VALUES (?, ?, ?, ?)',
      [hostel_name, type, total_floors, warden_id]
    );
    res.status(201).json({ message: 'Hostel added', hostel_id: result.insertId });
  } catch (err) { handleError(res, err); }
};