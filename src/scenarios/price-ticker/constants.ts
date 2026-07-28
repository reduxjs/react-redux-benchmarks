// A trading / forex price board. A watchlist of instruments whose prices tick
// frequently; every row derives a small indicator (spread, % change, sparkline
// stats) from its instrument in a plain, non-memoized `useSelector`.
//
// The point of interest: only a handful of prices change per tick, but
// react-redux notifies *every* subscriber on every store update, so all
// NUM_INSTRUMENTS selectors re-run on each tick — a realistic large-app fan-out.

export const NUM_INSTRUMENTS = 10000

// Prices that change on each tick (the rest are unchanged, but still re-selected).
export const PRICES_PER_TICK = 30

// Length of the per-instrument price history the sparkline/indicators run over.
export const HISTORY_LENGTH = 64
