const { verifyToken } = require('../lib/auth');
const prisma = require('../lib/prisma');

// Verifica el JWT y carga el usuario en req.user
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.active) return res.status(401).json({ error: 'Usuario invalido o inactivo' });

    req.user = { id: user.id, role: user.role, username: user.username, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido' });
  }
}

// Restringe por rol: requireRole('ADMIN', 'MANAGER')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sin permisos suficientes' });
    }
    next();
  };
}

// Devuelve los IDs de modelos a las que el usuario tiene acceso.
// ADMIN y MANAGER -> todas. CHATTER -> solo las asignadas.
async function accessibleModelIds(user) {
  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    const models = await prisma.model.findMany({ select: { id: true } });
    return models.map((m) => m.id);
  }
  const assignments = await prisma.modelAssignment.findMany({
    where: { userId: user.id },
    select: { modelId: true },
  });
  return assignments.map((a) => a.modelId);
}

module.exports = { authenticate, requireRole, accessibleModelIds };
