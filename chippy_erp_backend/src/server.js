import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import zoneSiteRoutes from './routes/zoneSite.routes.js';
import roomRoutes from './routes/room.routes.js';
import enquiryRoutes from './routes/enquiry.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import poRoutes from './routes/pos.routes.js';
import roleRoutes from './routes/role.routes.js';
import departmentRoutes from './routes/department.routes.js';
import moduleRoutes from './routes/module.routes.js';
import permissionRoutes from './routes/permission.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || 
        origin.includes("localhost") || 
        origin.includes("13.201.124.83") || 
        origin.includes("chippy-erp.pages.dev") || 
        origin.includes("trycloudflare.com")) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// Health Check Route
app.get('/api', (req, res) => {
  res.json({ message: 'Chippy ERP API is running', status: 'online' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/locations', zoneSiteRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pos', poRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/permissions', permissionRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chippy ERP Backend Server running on http://0.0.0.0:${PORT}`);
});
