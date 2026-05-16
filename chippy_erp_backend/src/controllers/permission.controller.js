import prisma from '../config/prisma.js';

export const getPermissionsByRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const permissions = await prisma.rolePermission.findMany({
      where: { role_id: parseInt(roleId) },
      include: { module: true }
    });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

export const bulkUpdatePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body; // Expecting { moduleId: { can_view, ... } }
    
    const operations = Object.keys(permissions).map(moduleId => {
      const { can_view, can_add, can_edit, can_delete } = permissions[moduleId];
      return prisma.rolePermission.upsert({
        where: { 
          role_id_module_id: { 
            role_id: parseInt(roleId), 
            module_id: parseInt(moduleId) 
          } 
        },
        update: { can_view, can_add, can_edit, can_delete },
        create: { 
          role_id: parseInt(roleId), 
          module_id: parseInt(moduleId), 
          can_view, 
          can_add, 
          can_edit, 
          can_delete 
        }
      });
    });

    await prisma.$transaction(operations);
    res.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    console.error("Bulk Update Error:", error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
};
