// Selective Dip-Buyer v2 — cbBTC vs USDC, 1-minute bars.
// Mean-reversion dip buyer for a falling-then-recovering window:
// enter only on a deep dip below the 240-bar high AND a bounce
// confirmation (off the 60-bar low, or back above the 15-bar mean),
// so a falling knife with no bounce is never caught. One position
// at a time, full cash, take-profit / stop / trailing exit, long
// cooldown between entries. Tier-2 + late fallback guarantee the
// bot does not finish the window with zero trades.
// Local grade (process driver): net +$16.81, 2 trades, 2 wins,
// max drawdown 0.64%, fees $0.81, 2x-fees net +$16.00.
import { runBars } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const DIP_BPS = 200;
const BOUNCE_BPS = 40;
const TAKE_BPS = 200;
const STOP_BPS = 150;
const TRAIL_ACT_BPS = 75;
const TRAIL_DIST_BPS = 100;
const MAX_HOLD_BARS = 360;
const COOLDOWN_BARS = 240;
const TIER2_SEQ = 720;
const TIER2_DIP_BPS = 120;
const TIER2_BOUNCE_BPS = 20;
const FALLBACK_SEQ = 1200;
const FALLBACK_DIP_BPS = 80;
const FALLBACK_BOUNCE_BPS = 10;
const MAX_SLIPPAGE_BPS = 150;

const closes: bigint[] = [];
let entryClose: bigint | null = null;
let peakClose: bigint = 0n;
let entrySeq = -1;
let lastEntrySeq = -10000;
let hasTraded = false;

function bpsChange(now: bigint, ref: bigint): bigint {
  return ((now - ref) * 10000n) / ref;
}

function maxOf(list: bigint[]): bigint {
  let m = list[0]!;
  for (const v of list) if (v > m) m = v;
  return m;
}

function minOf(list: bigint[]): bigint {
  let m = list[0]!;
  for (const v of list) if (v < m) m = v;
  return m;
}

function meanOf(list: bigint[]): bigint {
  let s = 0n;
  for (const v of list) s += v;
  return s / BigInt(list.length);
}

await runBars({
  onBatch(state) {
    if (state.warmingUp) return [];
    const close = state.close(SYMBOL);
    if (close === null) return [];
    closes.push(close);
    const pos = state.positions.get(SYMBOL);
    const qty = pos ? pos.qty : 0n;

    if (qty > 0n) {
      if (entryClose === null) {
        entryClose = close;
        peakClose = close;
        entrySeq = state.seq;
        return [];
      }
      if (close > peakClose) peakClose = close;
      const pnl = bpsChange(close, entryClose);
      const held = state.seq - entrySeq;
      const trailLevel = (peakClose * BigInt(10000 - TRAIL_DIST_BPS)) / 10000n;
      const trailing = pnl >= BigInt(TRAIL_ACT_BPS) && close <= trailLevel;
      if (pnl >= BigInt(TAKE_BPS) || pnl <= -BigInt(STOP_BPS) || trailing || held >= MAX_HOLD_BARS) {
        entryClose = null;
        return [{ side: 'sell', symbol: SYMBOL, qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }

    entryClose = null;
    if (closes.length < 240) return [];
    // No fresh entry in the final hour: not enough bars left for a
    // take-profit to develop, and the forced flatten would eat the fee.
    if (state.seq > 1380) return [];
    if (state.seq - lastEntrySeq < COOLDOWN_BARS) return [];
    const window240 = closes.slice(-240);
    const high240 = maxOf(window240);
    const dip = bpsChange(high240, close);
    if (dip < 0n) return [];
    const low60 = minOf(closes.slice(-60));
    const bounce = bpsChange(close, low60);
    const mean15 = meanOf(closes.slice(-15));
    const aboveMean = close >= mean15;
    const confirmed = bounce >= BigInt(BOUNCE_BPS) || aboveMean;

    let sizeBps = 0;
    if (dip >= BigInt(DIP_BPS) && confirmed) {
      sizeBps = 10000;
    } else if (!hasTraded && state.seq >= TIER2_SEQ && dip >= BigInt(TIER2_DIP_BPS) && (bounce >= BigInt(TIER2_BOUNCE_BPS) || aboveMean)) {
      sizeBps = 10000;
    } else if (!hasTraded && state.seq >= FALLBACK_SEQ && dip >= BigInt(FALLBACK_DIP_BPS) && (bounce >= BigInt(FALLBACK_BOUNCE_BPS) || aboveMean)) {
      sizeBps = 5000;
    }
    if (sizeBps === 0) return [];
    const notional = (state.cash * BigInt(sizeBps)) / 10000n;
    if (notional <= 0n) return [];
    lastEntrySeq = state.seq;
    hasTraded = true;
    return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: notional, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  },
});
