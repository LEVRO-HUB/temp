import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';

// Get all employees (accessible to authenticated users, but maybe later restrict to managers/admins)
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        role_master: true,
        dept_master: true
      }
    });

    const mapped = employees.map(emp => ({
      ...emp,
      role: (emp.role_master?.name || 'Employee').toLowerCase()
    }));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: {
        role_master: true,
        dept_master: true
      }
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const mapped = {
      ...employee,
      role: (employee.role_master?.name || 'Employee').toLowerCase()
    };

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, email, mobile_number, role_id, dept_id, password, login_enabled } = req.body;

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
        role_id: role_id ? parseInt(role_id) : null,
        dept_id: dept_id ? parseInt(dept_id) : null,
        password_hash,
        login_enabled: login_enabled === true || login_enabled === 'true',
        created_by: req.user.id,
      }
    });

    req.io.emit('employee_data_changed', { action: 'create', id: newEmployee.id });
    res.status(201).json({ message: 'Employee created successfully', id: newEmployee.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile_number, role_id, dept_id, is_active, login_enabled } = req.body;

    const updated = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        name,
        mobile_number,
        role_id: role_id ? parseInt(role_id) : null,
        dept_id: dept_id ? parseInt(dept_id) : null,
        is_active: is_active === undefined ? undefined : (is_active === true || is_active === 'true'),
        login_enabled: login_enabled === undefined ? undefined : (login_enabled === true || login_enabled === 'true')
      }
    });
    req.io.emit('employee_data_changed', { action: 'update', id: updated.id });
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

    req.io.emit('employee_data_changed', { action: 'toggle_login', id: parseInt(id) });
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
      include: {
        role_master: true
      }
    });
    if (!employee) return res.status(404).json({ message: 'User not found' });

    const mapped = {
      ...employee,
      role: (employee.role_master?.name || 'Employee').toLowerCase()
    };

    res.json(mapped);
  } catch (error) {
    console.error(error);
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

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id);

    // Prevent deleting oneself
    if (employeeId === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check dependencies (transactions they created)
    const hasDependencies = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        enquiries: { take: 1 },
        bookings: { take: 1 },
        purchaseOrders: { take: 1 },
        paymentsCreated: { take: 1 }
      }
    });

    if (
      hasDependencies.enquiries.length > 0 ||
      hasDependencies.bookings.length > 0 ||
      hasDependencies.purchaseOrders.length > 0 ||
      hasDependencies.paymentsCreated.length > 0
    ) {
      // Soft delete: deactivate account
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          is_active: false,
          login_enabled: false
        }
      });
      req.io.emit('employee_data_changed', { action: 'soft_delete', id: employeeId });
      return res.json({ message: "Employee has historical transactions. Account has been deactivated and login disabled to preserve records." });
    }

    // Hard delete if no dependencies
    await prisma.employee.delete({
      where: { id: employeeId }
    });

    req.io.emit('employee_data_changed', { action: 'delete', id: employeeId });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
};
