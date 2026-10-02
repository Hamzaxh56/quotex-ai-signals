# Quotex AI V7 — backend included

Deployable Node/Express dashboard. The browser does not contain the Twelve Data API key.

## Features
- Backend proxy for live OHLC market candles
- EUR/JPY plus other FX pairs
- 1/5/15 minute candles
- Mobile dashboard and candlestick chart
- Live polling and candle-boundary countdown
- EMA(9/21), RSI(14), MACD signal logic
- No fake 93% win-rate claim
- No guaranteed-profit claim

## Deploy on Render
1. Upload all files to GitHub.
2. Create a Render Web Service from the repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable `TWELVE_DATA_API_KEY` with your API key.
6. Deploy and open the Render URL.

The app does not place trades on Quotex. It is market-data/signal software only. Signal strength is not a probability of winning.
