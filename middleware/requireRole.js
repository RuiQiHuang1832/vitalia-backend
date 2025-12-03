export const requireRole = (role) => {
  return function(req, res,  next) {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  }
}
