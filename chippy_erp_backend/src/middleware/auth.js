import jwt from 'jsonwebtoken';

// Middleware to verify JWT syntax and validity
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user; // attach user payload
    next();
  });
};

// Middleware to enforce Admin role
export const requireAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role === 'admin' || role === 'super admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};

// Middleware to enforce Admin or Manager roles
export const requireManagerOrAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role === 'admin' || role === 'super admin' || role === 'manager') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Manager privileges required.' });
  }
};
