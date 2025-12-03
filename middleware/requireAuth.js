import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // check header presence
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }
  // strip "Bearer " prefix
  const accessToken = authHeader.replace('Bearer ', '');
  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }
  let payload;
  try {
    // verify signature and expiration
    payload = jwt.verify(accessToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
  req.user = payload;
  next();
}
