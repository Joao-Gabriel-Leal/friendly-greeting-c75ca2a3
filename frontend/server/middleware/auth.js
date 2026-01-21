const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_padrao';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin' && req.userRole !== 'developer') {
    return res.status(403).json({ error: 'Acesso negado. Requer permissão de administrador.' });
  }
  return next();
};

const professionalMiddleware = (req, res, next) => {
  if (req.userRole !== 'professional' && req.userRole !== 'admin' && req.userRole !== 'developer') {
    return res.status(403).json({ error: 'Acesso negado. Requer permissão de profissional.' });
  }
  return next();
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  professionalMiddleware,
  generateToken,
  JWT_SECRET
};
