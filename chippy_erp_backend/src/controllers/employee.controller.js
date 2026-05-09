import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';

// Get all employees (accessible to authenticated users, but maybe later restrict to managers/admins)
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true, name: true, email: true, mobile_number: true, 
        role: true, role_id: true, dept_id: true,
        is_active: true, login_enabled: true, created_at: true,
        role_master: true, dept_master: true
      }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true, name: true, email: true, mobile_number: true, 
        role: true, role_id: true, dept_id: true,
        is_active: true, login_enabled: true,
        role_master: true, dept_master: true
      }
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, email, mobile_number, role, role_id, dept_id, password } = req.body;
    
    // Check if exists
    const existing = await prisma.employee.findFirst({
      where: { OR: [{ email }, { mobile_number }] }
    });
    if (existing) return res.status(400).json({ message: 'Email or mobile already exists.' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newEmployee = await prisma.employee.create({
      data: {
        name,
        email,
        mobile_number,
        role: role || 'staff',
        role_id: role_id ? parseInt(role_id) : null,
        dept_id: dept_id ? parseInt(dept_id) : null,
        password_hash,
        created_by: req.user.id,
        // login_enabled defaults to false per requirements!
      }
    });

    res.status(201).json({ message: 'Employee created successfully', id: newEmployee.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile_number, role, role_id, dept_id, is_active } = req.body;
    
    const updated = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        mobile_number, 
        role, 
        role_id: role_id ? parseInt(role_id) : null,
        dept_id: dept_id ? parseInt(dept_id) : null,
        is_active 
      }
    });
    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

// Only Admin can enable login
export const toggleLoginAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { login_enabled } = req.body;
    
    if (typeof login_enabled !== 'boolean') {
      return res.status(400).json({ message: 'login_enabled must be a boolean' });
    }

    await prisma.employee.update({
      where: { id: parseInt(id) },
      data: { login_enabled }
    });
    
    res.json({ message: `Login access updated to ${login_enabled}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle login access' });
  }
};

// --- Profile / "Me" Endpoints ---

export const getCurrentEmployee = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, mobile_number: true, 
        role: true, is_active: true, login_enabled: true, created_at: true
      }
    });
    if (!employee) return res.status(404).json({ message: 'User not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateCurrentEmployee = async (req, res) => {
  try {
    const { name, mobile_number } = req.body;
    await prisma.employee.update({
      where: { id: req.user.id },
      data: { name, mobile_number }
    });
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // Find employee with password
    const employee = await prisma.employee.findUnique({
      where: { id: req.user.id }
    });

    if (!employee) return res.status(404).json({ message: 'User not found' });

    // Check old password
    const validPassword = await bcrypt.compare(oldPassword, employee.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await prisma.employee.update({
      where: { id: req.user.id },
      data: { password_hash }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
