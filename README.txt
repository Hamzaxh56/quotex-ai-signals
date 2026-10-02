# Quotex-style AI Market Signals V6

This is a repaired frontend prototype designed to use **real market candles** instead of hard-coded/demo candles.

## Important
- It does NOT guarantee profits.
- The displayed "strength" is an indicator score, NOT a probability of winning.
- It does not connect to or place trades on Quotex.
- You must provide your own Twelve Data API key.
- For a public GitHub Pages site, do not put a private API key directly into source code.

## Live data
The app requests 1m/5m/15m OHLC candles from Twelve Data:
https://twelvedata.com/

## 1-minute behavior
When using 1 MIN analysis and 1 MIN expiry, the countdown is aligned to the next 1-minute candle boundary. The previous version's 04:45 countdown is not used.

## Deploy
1. Extract the ZIP.
2. Upload index.html, style.css and app.js to your GitHub repository.
3. Enable GitHub Pages.
4. Open the site.
5. Paste your Twelve Data API key in the Live API setup section.
6. Choose EUR/JPY + 1 MIN + 1 MIN.
