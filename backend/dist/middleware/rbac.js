// Define the role hierarchy or allowed modules per role
const rolePermissions = {
    'Super Admin': ['all'],
    'Admin': ['almost_everything'], // We can refine this later
    'HR': ['employees', 'payroll', 'attendance'],
    'Accounts': ['expenses', 'reports/accounts', 'reports/business', 'vendors', 'purchase-orders', 'challans', 'material-inward', 'scrap', 'overhead-report'],
    'Purchase': ['vendors', 'purchase-orders', 'inventory', 'challans', 'material-inward', 'scrap', 'rmc-grades'],
    'Site Engineer': ['production', 'consumption', 'sites', 'inventory', 'challans', 'material-inward', 'scrap', 'rmc-grades'],
    'Manager': ['reports/accounts', 'reports/business', 'reports/efficiency', 'reports/targets', 'reports/time-motion', 'reports/maintenance-overview', 'stats', 'dashboard', 'overhead-report'],
    'Viewer': ['read_only'] // Special handling for Viewer
};
export const authorize = (allowedModules) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const userRole = req.user.role;
        const normalizedRole = userRole ? userRole.toLowerCase() : '';
        if (normalizedRole === 'super admin' || normalizedRole === 'admin') {
            return next(); // Administrators have access to everything
        }
        if (normalizedRole === 'viewer' && req.method !== 'GET') {
            return res.status(403).json({ message: 'Read-only access' });
        }
        // Basic module-based authorization
        const userModules = rolePermissions[userRole] || [];
        // If the required modules for the route intersect with the user's allowed modules, allow access
        const hasAccess = allowedModules.some(module => userModules.includes(module));
        if (hasAccess || (userRole === 'Viewer' && req.method === 'GET')) {
            next();
        }
        else {
            res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
        }
    };
};
