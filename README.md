# Selective Dip-Buyer v2 — btc-race-24h-20261118-1444

A cbBTC/USDC dip-buying bot for make.fun's 24-hour BTC race.

## Strategy

Mean-reversion dip buyer, built for a falling-then-recovering window:

- Enter only when the close is at least 200 bps below the 240-bar high
  **and** a bounce is confirmed: either 40+ bps off the 60-bar low, or
  the close is back above its 15-bar mean. A falling knife with no
  bounce is never caught.
- One position at a time, 100% of cash per entry.
- Exit on +200 bps take-profit, -150 bps stop, a 100 bps trailing stop
  once +75 bps is reached, or 360 bars held.
- At most one entry per 240 bars; no fresh entry after bar 1380.
- Insurance against a zero-trade window: from bar 720 a 120 bps dip
  can trigger an entry, and from bar 1200 an 80 bps dip buys 50% cash.

## Local grade (dev window, process driver)

- Net PnL: **+$16.81 USDC**
- Trades: 2, win rate 100%
- Max drawdown: 0.64%
- Fees: $0.81; net PnL at 2x fees: +$16.00
- 0 rejected orders; deterministic (two executions byte-identical)

Parameter plateau checked locally: D180/D200 and bounce 20–60 bps all
grade +$16.5 to +$16.8, so the result is not a knife-edge tuning.

## Run

Node 22, standard library only, no network, no wall clock.
The bot speaks `agent-fun/bars-replay/v1` via the vendored kit
shim in `vendor/` (byte-for-byte copy of the kit SDK shim).

```
node main.ts
```
