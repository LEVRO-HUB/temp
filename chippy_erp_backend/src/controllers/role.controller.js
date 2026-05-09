import prisma from '../config/prisma.js';

export const getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.roleMaster.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const role = await prisma.roleMaster.create({
      data: { name, icon }
    });
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create role' });
  }
};
