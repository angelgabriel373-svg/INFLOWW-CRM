const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

// GET /api/tickets
router.get('/', async (req, res) => {
  const tickets = await prisma.ticket.findMany({
    include: { createdBy: { select: { id: true, name: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tickets);
});

// POST /api/tickets  (cualquier usuario autenticado)
router.post('/', async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Titulo y descripcion requeridos' });
  const ticket = await prisma.ticket.create({
    data: { title, body, createdById: req.user.id },
    include: { createdBy: { select: { id: true, name: true, username: true } } },
  });
  res.status(201).json(ticket);
});

// PATCH /api/tickets/:id  (admin/manager cambian estado)
router.patch('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const { status } = req.body;
  const ticket = await prisma.ticket.update({ where: { id: req.params.id }, data: { status } });
  res.json(ticket);
});

module.exports = router;
