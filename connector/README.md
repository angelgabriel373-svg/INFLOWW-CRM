# Conector OnlyFans ↔ CRM (fase 2 — EN CONSTRUCCION)

Este es el "puente" que conecta las cuentas reales de OnlyFans con el dashboard del CRM.
Usa la sesion de la modelo (tu inicias sesion una vez; nunca se guarda la contraseña,
solo la sesion). Estado: **experimental, en desarrollo.**

## Probar el puente (en tu PC)

```bash
cd C:\Users\angel\infloww-crm\connector
npm install
npx playwright install chromium

# 1) Inicia sesion UNA vez (se abre un navegador; logueate tu)
node login.js marta

# 2) Lee las conversaciones reales de OnlyFans (prueba)
node read-chats.js marta
```

Si el paso 2 imprime las conversaciones reales → el puente funciona y el siguiente
paso es volcarlas al dashboard `infloww-crm` automaticamente y permitir responder
desde ahi (como Infloww).

## Notas honestas
- Esto va **contra los terminos de OnlyFans**: riesgo de baneo de la cuenta. Probar
  primero en una cuenta de prueba, no en Marta/Mara, hasta que sea estable.
- Es **fragil**: cuando OnlyFans cambia su web, hay que repararlo.
- `sessions/` (las sesiones guardadas) NO debe subirse a GitHub (ya esta ignorado).
