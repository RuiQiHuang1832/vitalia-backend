import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  // Before I was using auth headers, now using cookies
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    //Clear ONLY the access token
    res.clearCookie('accessToken', {
      path: '/',
    })
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};
