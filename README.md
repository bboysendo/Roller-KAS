# ROLLER KAS — MVP

Juego web de simulación de minería, inspirado conceptualmente en juegos tipo RollerCoin, con identidad propia. Construyes una granja de minería: juegas, consigues ROLL, compras miners, subes hashrate, mejoras la granja y compites en el leaderboard.

> **ROLL es una moneda ficticia sin valor real.** Esta versión NO incluye blockchain, wallets, depósitos, retiros ni dinero real. Todo son datos mock guardados en el navegador.

Este proyecto no tiene relación con KASMAN y no reutiliza su branding, personajes ni assets.

---

## Bucle de juego

```
JUGAR → CONSEGUIR RECURSOS → COMPRAR MINEROS → AUMENTAR HASHRATE → MEJORAR LA FARM → COMPETIR
```

- **Dashboard**: username, ROLL, hashrate, nº de miners, nivel, mining power (ROLL/s), recursos.
- **Farm**: rejilla de slots. Coloca miners de tu inventario en slots vacíos, mejora miners y desbloquea slots.
- **Miners**: tienda de miners. Algunos requieren un nivel de jugador mínimo.
- **Arcade**: *Block Catch*, un minijuego arcade con puntuación, timer, vidas, game over, pantalla de inicio y de resultado. Da ROLL y XP.
- **Leaderboard**: ranking ficticio por hashrate. Tu fila aparece destacada.
- **Bonus diario**: ROLL cada 24h con racha (se mantiene si reclamas dentro de 48h).
- **Producción**: los miners colocados en la farm producen ROLL cada segundo. Si cierras el navegador, produces offline hasta un máximo de horas (configurable).

---

## Identidad: KAS + ZKAS MINING

ROLLER KAS es un juego de minería de **KAS y ZKAS**. La portada, la barra superior y el dashboard lo dicen desde el primer momento:

- **Portada (login)**: ROLLER KAS, `KAS + ZKAS MINING`, `Mine KAS. Mine ZKAS.` y dos badges de moneda (KAS verde, ZKAS morado) unidos por 🤝.
- **Dashboard**: KAS HASHRATE, ZKAS HASHRATE y TOTAL HASHRATE, con la producción simulada de cada moneda y los saldos de KAS y ZKAS.
- **Farm**: barra de reparto KAS/ZKAS en porcentaje, y cada miner muestra su tipo: 🟢 KAS, 🟣 ZKAS o ⚡ DUAL.
- **Miners**: la tienda agrupa los tres tipos (KAS MINER, ZKAS MINER, DUAL MINER) y dice qué produce cada uno.

Los badges son texto sobre un disco de color: **no son logos oficiales** de KAS ni de ZKAS. Si más adelante hay logos oficiales, se sustituyen en `src/components/CoinBadge.tsx`.

## Minería KAS / ZKAS (simulada)

Hay tres tipos de miner (`type` en `src/data/miners.ts`, textos en `MINER_TYPES`):

| Tipo | Produce | Reparto de su hashrate |
|---|---|---|
| `kas` — KAS MINER | Solo KAS | 100% a KAS |
| `zkas` — ZKAS MINER | Solo ZKAS | 100% a ZKAS |
| `dual` — DUAL MINER | KAS y ZKAS a la vez | 50% a KAS, 50% a ZKAS |

Cada miner tiene: `type`, `hashrate` (nivel 1), `price` (ROLL), `level` y mejoras (`upgradeBaseCost`, `upgradeCostMultiplier`, `maxLevel`). Su producción por nivel sale de `minerProduction()` en `src/game/economy.ts`:

- **KAS/s** = hashrate × reparto KAS × `ECONOMY.simulated.kasPerThPerSecond` (0.005). Ejemplo: 60 TH/s de KAS = 0.30 KAS/s.
- **ZKAS/s** = hashrate × reparto ZKAS × `ECONOMY.simulated.zkasPerThPerSecond` (0.005).
- **ROLL/s** = hashrate × `ECONOMY.rollPerThPerSecond` (sin cambios).

**KAS y ZKAS son recursos simulados.** Se acumulan como saldo en el save (`kas`, `zkas`) y no se pueden convertir a ROLL ni a monedas reales. ROLL sigue siendo la moneda interna con la que se compran miners, mejoras y slots.

**Inicio:** cada jugador nuevo empieza con un KAS Miner básico y un ZKAS Miner I, ambos colocados en la farm, para probar las dos monedas desde el primer segundo.

**Saves antiguos:** al cargar, un save sin ningún miner ZKAS (zkas o dual) recibe un ZKAS Miner I (en la farm si hay un slot libre, si no en el inventario). El progreso no se toca. Los saldos de KAS y ZKAS empiezan en 0.

Los carriles de la farm reparten el hashrate total: cada miner cuenta según su reparto y `farmSplit()` devuelve porcentajes que suman 100%.

## Login y logout

- Al abrir la app aparece la portada de login. Se entra con un **nombre de usuario**. No hay contraseña ni wallet: es un perfil local de este navegador.
- Si el nombre ya existe, se **recupera el progreso** guardado. Si no, se crea un perfil nuevo. Los nombres no distinguen mayúsculas.
- **Log out**: menú de usuario (el botón con nivel y nombre, arriba a la derecha) → *Log out*. Vuelve a la portada. El progreso **no se borra**.
- **Reset**: en el pie de página. Empieza de cero el progreso del jugador activo y conserva su nombre.
- La portada muestra los perfiles guardados en este navegador como atajos.

Almacenamiento (localStorage):

| Clave | Contenido |
|---|---|
| `roller-kas.profiles.v1` | Progreso de todos los perfiles. Sobrevive al logout. |
| `roller-kas.session.v1` | Perfil con sesión iniciada. Se borra al hacer logout. |
| `roller-kas.save.v1` | Save de la primera versión. Se migra una vez a los perfiles y no se borra. |

La wallet (mock) no ha cambiado: sigue en su propio botón de la barra superior.

## Instalación y ejecución

Requisitos: **Node.js 20+** y **pnpm** (o npm).

```bash
pnpm install
pnpm dev          # servidor de desarrollo en http://localhost:5180
```

Otros comandos:

```bash
pnpm test         # tests unitarios (economía, reducer, minijuego)
pnpm build        # comprobación de tipos + build de producción en dist/
pnpm preview      # sirve dist/ para probar el build
```

Con npm: `npm install`, `npm run dev`, etc. (los scripts son los mismos).

---

## Estructura del proyecto

```
roller-kas-mvp/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx              Punto de entrada
│   ├── App.tsx               Shell: navegación (hash), ticker de producción, onboarding
│   ├── data/                 ⚙️ CONFIGURACIÓN (miners, monedas, economía, minijuego, leaderboard mock)
│   │   ├── coins.ts          KAS / ZKAS: símbolos, etiquetas de minería, textos de marca
│   │   ├── miners.ts
│   │   ├── economy.ts
│   │   ├── minigame.ts
│   │   └── leaderboard.ts
│   ├── game/                 Lógica pura, sin React ni DOM
│   │   ├── types.ts          Tipos del save y las acciones
│   │   ├── economy.ts        Fórmulas: hashrate, costes, niveles, producción, bonus
│   │   ├── reducer.ts        applyAction(state, action) → nuevo estado
│   │   ├── blockCatch.ts     Motor del minijuego Block Catch
│   │   └── blockCatchRender.ts  Dibujo en canvas del minijuego
│   ├── services/             Contratos y capa de datos
│   │   ├── types.ts          Interfaces: walletService, miningService, rewardService, leaderboardService
│   │   ├── mock/mockServices.ts  Implementaciones mock (locales)
│   │   ├── index.ts          Punto único donde se eligen las implementaciones
│   │   ├── gameStore.ts      Store de la app (estado, persistencia, avisos)
│   │   └── storage.ts        localStorage con protección ante errores
│   ├── components/           UI reutilizable (TopBar, MinerCard, FarmGrid, BlockCatchGame…)
│   ├── pages/                Dashboard, Farm, Shop, Arcade, Leaderboard
│   ├── utils/                Formato de números, hooks (useNow, useAnimatedNumber)
│   └── styles/global.css     Tema oscuro verde/neón, variables en :root, responsive
```

Regla de capas: `data/` no importa nada; `game/` solo importa `data/`; `services/` usa `game/`; `components/` y `pages/` usan `services/` y `game/`. La UI nunca llama a `localStorage` ni a `Date.now()` directamente (el store inyecta `now`).

---

## Cómo modificar los miners

Edita **`src/data/miners.ts`**. Cada miner es un objeto:

| Campo | Significado |
|---|---|
| `id` | Identificador estable. **No lo cambies una vez hay saves** (se guardan por id). |
| `name` | Nombre visible. |
| `hashrate` | TH/s base en nivel 1. |
| `price` | Precio de compra en ROLL. |
| `upgradeBaseCost` | Coste en ROLL de subir del nivel 1 al 2. |
| `upgradeCostMultiplier` | Cada nivel siguiente cuesta el anterior × este valor. |
| `hashrateGainPerLevel` | Hashrate extra por nivel (0.25 = +25% del base por nivel). |
| `maxLevel` | Nivel máximo. |
| `requiredPlayerLevel` | Nivel de jugador necesario para comprarlo. |
| `type` | `kas`, `zkas` o `dual`. Define qué moneda produce (ver “Minería KAS / ZKAS”). |
| `tier` | 1–5, define el color de la tarjeta. |
| `description` | Texto de la tienda. |

Para añadir un miner: añade un objeto al array `MINERS`. Aparece solo en la tienda y en la farm.

---

## Cómo modificar la economía

Edita **`src/data/economy.ts`**:

- `rollPerThPerSecond`: ROLL por segundo por cada TH/s colocado. Es el principal control de velocidad de la economía.
- `offlineCapHours`: horas máximas de producción offline.
- `farm.startingSlots`, `farm.maxSlots`, `farm.slotUnlockBaseCost`, `farm.slotUnlockMultiplier`: slots y su coste.
- `dailyBonus`: ROLL base, incremento por día de racha y tope de racha.
- `xp`: XP por ROLL gastado, miner comprado, mejora, slot desbloqueado y punto de minijuego.
- `LEVEL_XP` (mismo archivo): umbrales de XP por nivel. El nivel N requiere `LEVEL_XP[N-1]` XP.

Los valores de compra de miners están en `miners.ts` y el ROLL inicial en `START_ROLL` (`src/game/reducer.ts`).

Después de cambiar la economía, ejecuta `pnpm test`: los tests comprueban las fórmulas base.

---

## Cómo añadir nuevos minijuegos

Block Catch es el ejemplo a seguir:

1. **Configuración**: añade `src/data/<tu-juego>.ts` con sus parámetros (duración, recompensa, plays diarios).
2. **Motor puro**: `src/game/<tu-juego>.ts` con `create…()` y `step…(state, dt, random)`. Sin React ni DOM, así se puede testear.
3. **Dibujo** (opcional): `src/game/<tu-juego>Render.ts` con una función que reciba el contexto de canvas y el estado.
4. **Componente**: `src/components/<TuJuego>.tsx` con pantalla de inicio, partida y resultado (copia la estructura de `BlockCatchGame.tsx`).
5. **Acciones de economía**: añade acciones al reducer (`minigame-start`/`minigame-reward` son el patrón) para que las recompensas pasen por `applyAction`.
6. **Página**: colócalo en `src/pages/Arcade.tsx` junto al existente.
7. Añade tests en `src/game/`.

---

## Qué partes son mock

| Parte | Estado actual |
|---|---|
| Wallet (`walletService`) | Mock. "Connect wallet" genera una dirección falsa guardada en localStorage. No hay firma ni red. |
| Mining (`miningService`) | Calcula el resumen de la farm en local. |
| Rewards (`rewardService`) | Registro en memoria (se pierde al recargar). No mueve tokens. |
| Leaderboard (`leaderboardService`) | Jugadores ficticios de `src/data/leaderboard.ts` + tu fila calculada en local. Sin backend. |
| Login | Perfil local por nombre de usuario, sin contraseña ni servidor. Solo en este navegador. |
| Progreso | Guardado por perfil en localStorage (`roller-kas.profiles.v1`). Solo en este navegador. |
| ROLL | Moneda interna ficticia. No tiene valor, no es transferible. |
| KAS / ZKAS | Recursos simulados: saldos internos del save. No son tokens, no se depositan ni retiran, no se convierten a ROLL. |

---

## Qué habría que implementar para blockchain

Las interfaces de `src/services/types.ts` están pensadas para sustituirse sin tocar la UI:

1. **walletService** → conexión real con Kaspa (p. ej. KasWare/Kasware-like wallet), red testnet primero, firma de mensajes para autenticar al jugador. Las direcciones y la red vienen del proveedor.
2. **rewardService** → pools de recompensas on-chain: reclamar ROLL/KAS/ZKAS mediante transacciones. El ledger local pasa a ser el historial verificable.
3. **leaderboardService** → backend real (API + base de datos) con ranking por hashrate verificable. Idealmente con replay/prueba de cómputo para evitar trampas.
4. **Depósitos y retiros** → nuevas interfaces (`depositService`, `withdrawService`) con validaciones de cantidad, comisiones de red y límites. No existen todavía.
5. **Seguridad del estado**: hoy la economía se calcula en el cliente y el save es editable. Antes de cualquier premio real hay que mover la validación al servidor (o a contratos) y no confiar en localStorage.
6. **Legal y cumplimiento**: revisar si ROLL o los premios constituyen juego con dinero o valores, según jurisdicción, antes de vender o distribuir.

Nada de esto está implementado. El MVP solo prepara los puntos de conexión.

---

## Notas técnicas

- Stack: React 19, TypeScript, Vite, CSS propio (sin Tailwind ni librerías de UI), vitest.
- Navegación por hash (`#/farm`, `#/arcade`…): recargar mantiene la página, sin router.
- El ticker de producción corre cada segundo mientras hay save; la producción offline se aplica al cargar.
- Responsive: escritorio (3 columnas en la farm), tablet (2) y móvil (1, con menú de navegación desplazable).
- Los movimientos del minijuego: flechas o A/D, o los botones de pantalla en móvil.
