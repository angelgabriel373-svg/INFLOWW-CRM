# OFM Panel — App de escritorio

App de escritorio (Electron) que junta el OnlyFans de todas las modelos en un solo panel,
con **login de trabajadores** y **bloqueo de estadisticas/dinero** para los chatters.

Es nuestro "Ferdium propio" integrado con el CRM: el login, los roles y las modelos
salen del dashboard (`https://ofm-crm.onrender.com`).

## Como funciona
1. El trabajador abre la app y entra con su usuario del CRM (admin / juki / etc.).
2. La app carga **solo las modelos asignadas** a ese usuario.
3. Cada modelo abre su **OnlyFans real** dentro de la app (sesion aislada y persistente).
4. Si el rol es **CHATTER**, se bloquean las paginas y APIs de dinero
   (estadisticas, statements, payouts, banking) — el chatter solo chatea.

## Arrancar
```
cd desktop
npm install
npm start
```
O doble clic en **ABRIR PANEL OFM.bat**.

## Primer uso (el admin lo prepara)
- Entra como admin, abre cada modelo y **inicia sesion en su OnlyFans una vez**.
  La sesion queda guardada (no hay que repetirlo cada dia).
- Para dar acceso a un chatter (Juki): instala la app en su PC, y el admin
  hace el login de OnlyFans de cada modelo ahi (asi el chatter nunca tiene las contraseñas).

## Seguridad
- `contextIsolation` activo, sin `nodeIntegration`, webviews endurecidas.
- El bloqueo de dinero se aplica a nivel de red (no solo CSS) y por rol.
- Nota honesta: es un panel de escritorio; un usuario con acceso fisico y conocimientos
  podria intentar saltarse el bloqueo. Para blindaje total haria falta el panel-espejo.

## Empaquetar como instalador (.exe) — opcional
```
npm run build:win
```
Genera un instalador en `dist/` para repartir a los trabajadores sin instalar Node.
