import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const employee = await prisma.employee.findUnique({ where: { email } });
    
    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    if (!employee.is_active || !employee.login_enabled) {
      return res.status(403).json({ message: 'Account is disabled or login not enabled.' });
    }
    
    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    const token = jwt.sign(
      { id: employee.id, role: employee.role, name: employee.name }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '12h' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: employee.id, 
        name: employee.name, 
        role: employee.role, 
        email: employee.email 
      } 
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};
