import prisma from '../config/prisma.js';

export const getAllDepartments = async (req, res) => {
  try {
    const depts = await prisma.departmentMaster.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(depts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const dept = await prisma.departmentMaster.create({
      data: { name, icon }
    });
    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department' });
  }
};
