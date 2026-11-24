const pool = require('../config/db');
const handleError = require('../utils/handleError');

exports.getAll = async (req, res) => {
  try {
    let sql = 'SELECT * FROM Warden';
    const params = [];
    if (req.user.role === 'Warden') { sql += ' WHERE warden_id = ?'; params.push(req.user.warden_id); }
    const [rows] = await pool.query(sql + ' ORDER BY warden_id', params);
    res.json(rows);
  } catch (err) { handleError(res, err); }
};

exports.create = async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO Warden (name, phone, email) VALUES (?, ?, ?)', [name, phone, email]);
    res.status(201).json({ message: 'Warden added', warden_id: result.insertId });
  } catch (err) { handleError(res, err); }
};

exports.update = async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    const [result] = await pool.query('UPDATE Warden SET name = ?, phone = ?, email = ? WHERE warden_id = ?',
      [name, phone, email, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Warden not found' });
    res.json({ message: 'Warden updated' });
  } catch (err) { handleError(res, err); }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Warden WHERE warden_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Warden not found' });
    res.json({ message: 'Warden deleted' });
  } catch (err) { handleError(res, err); }
};