function handleError(res, err) {
  // Our trigger/procedure SIGNAL messages (full room, gender mismatch, etc.)
  if (err.sqlState === '45000') {
    return res.status(400).json({ message: err.sqlMessage });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    const msg = err.sqlMessage.includes('uq_one_active_room')
      ? 'Student already has an active room'
      : 'Duplicate entry: ' + err.sqlMessage;
    return res.status(409).json({ message: msg });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'Referenced record does not exist' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'Cannot delete: record is in use' });
  }
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({ message: 'Value violates a table rule: ' + err.sqlMessage });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
}

module.exports = handleError;