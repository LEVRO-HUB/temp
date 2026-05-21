import { useContext } from 'react';
import { PermissionContext } from '../contexts/PermissionContext';

/**
 * usePermissions()
 * Returns helpers to check RBAC permissions anywhere in the app.
 *
 * Usage:
 *   const { can } = usePermissions();
 *   if (can('bookings', 'add')) { ... }
 *
 *   <button disabled={!can('bookings', 'edit')}>Edit</button>
 */
export function usePermissions() {
  const { permissions, loading } = useContext(PermissionContext);

  /**
   * can(moduleKey, action?)
   * action: 'view' | 'add' | 'edit' | 'delete'  (default: 'view')
   */
  const can = (moduleKey, action = 'view') => {
    if (loading) return false;
    const perm = permissions.find(p => p.module?.module_key === moduleKey);
    if (!perm) return false;
    switch (action) {
      case 'view':   return !!perm.can_view;
      case 'add':    return !!perm.can_add;
      case 'edit':   return !!perm.can_edit;
      case 'delete': return !!perm.can_delete;
      default:       return false;
    }
  };

  return { can, permissions, loading };
}
