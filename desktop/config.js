// Configuracion de la app de escritorio.
// API_URL: el dashboard/CRM que ya tienes desplegado (login, roles, modelos).
module.exports = {
  API_URL: process.env.OFM_API_URL || 'https://ofm-crm.onrender.com',
  // Patrones de OnlyFans que se BLOQUEAN para los chatters (paginas y APIs de dinero).
  BLOCK_PATTERNS: [
    '/my/statistics',
    '/my/statements',
    '/my/payout',
    '/my/payout-request',
    '/my/banking',
    '/my/promotions',
    '/my/payments',
    '/api2/v2/payouts',
    '/api2/v2/statistics',
    '/api2/v2/earnings',
    '/api2/v2/users/me/balance',
    '/api2/v2/payout',
  ],
};
