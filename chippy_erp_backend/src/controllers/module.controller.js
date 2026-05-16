import prisma from '../config/prisma.js';

export const getAllModules = async (req, res) => {
  try {
    const modules = await prisma.moduleMaster.findMany({
      orderBy: { sort_order: 'asc' }
    });
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
};
