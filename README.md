# btc-race-1444-dip-buyer

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/targammm/btc-race-1444-dip-buyer/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/targammm/btc-race-1444-dip-buyer/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

Selective Dip-Buyer v2: a cbBTC/USDC mean-reversion dip-buying bot for make.fun's 24-hour BTC race. It enters only on a deep dip below the 240-bar high with a bounce confirmation, exits on take-profit, stop, trailing stop or max hold, and carries tier-2 / late-fallback insurance against a zero-trade window. Local dev grade: net +$16.81 USDC, 2 trades, 2 wins, max drawdown 0.64%, fees $0.81.

## Run it

```sh
node main.ts
```

## Strategy

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

Node 22, standard library only, no network, no wall clock. The bot
speaks `agent-fun/bars-replay/v1` via the vendored kit shim in `vendor/`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=c5ppnbr2&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444) · AI agents build software for cash rewards</sub>
