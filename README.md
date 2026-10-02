# QUOTEX AI V5 — Same Timeframe + Live Market

Features:
- One timeframe selector controls BOTH signal duration and expiry.
- 1 MIN signal = 1:00 expiry countdown.
- 5 MIN signal = 5:00 expiry countdown.
- 15 MIN = 15:00, 30 MIN = 30:00, 1 HOUR = 1:00:00, 4 HOURS = 4:00:00, 1 DAY = 24:00:00.
- Live candlestick data through Twelve Data.
- Technical signal score based on recent price momentum.
- Mobile dark/red dashboard.

## Important: API key required
This project does not contain an API key. Get your own Twelve Data key and put it in `app.js`:

`const API_KEY = "YOUR_KEY_HERE";`

Twelve Data provides REST market data and WebSocket streaming; the browser version here uses REST candles for simpler GitHub Pages deployment. See their documentation for current plan/usage limits.

Do not use this as a guarantee of profits. A signal score is not a guaranteed win rate and the dashboard does not automatically place trades.
