require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const { verifyToken, allowRoles } = require('./middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hostel Allocation System API is running. Try /api/health');
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS students FROM Student');
    res.json({ status: 'ok', students: rows[0].students });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/students',    verifyToken, allowRoles('Admin', 'Warden'), require('./routes/studentRoutes'));
app.use('/api/hostels',     verifyToken, allowRoles('Admin', 'Warden'), require('./routes/hostelRoutes'));
app.use('/api/rooms',       verifyToken, require('./routes/roomRoutes'));
app.get('/api/me', verifyToken, allowRoles('Student'), require('./controllers/allocationController').getMine);
app.use('/api/allocations', verifyToken, allowRoles('Admin', 'Warden'), require('./routes/allocationRoutes'));
app.use('/api/payments',    verifyToken, allowRoles('Admin', 'Warden'), require('./routes/paymentRoutes'));
app.use('/api/wardens',     verifyToken, allowRoles('Admin', 'Warden'), require('./routes/wardenRoutes'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));