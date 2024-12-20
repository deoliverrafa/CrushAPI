import jwt from 'jsonwebtoken'

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token expirado.' });
      }
      return res.status(403).json({ message: 'Token inválido.' });
    }

    req.user = user;
    next();
  });
};

export default authenticateToken;
