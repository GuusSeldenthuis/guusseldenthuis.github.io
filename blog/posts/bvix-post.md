# BVIX: Designing a Custom Bitcoin Volatility Index

The VIX measures how nervous the stock market is by looking at options pricing on the S&P 500. The more expensive the options, the more uncertainty traders are pricing in. I wanted the same thing for Bitcoin, but nothing out there was quite what I was looking for. So I built BVIX: two numbers, BVIX-V for raw volatility magnitude and BVIX-D for directional bias. BVIX-V is essentially Deribit's DVOL, their native 30-day implied volatility index for BTC options. BVIX-D is the part that doesn't exist anywhere else: a composite signal that tries to tell you not just how volatile the market expects things to be, but which way it's leaning.

BVIX-V is straightforward, Deribit does the heavy lifting:

```python
async def fetch_bvix_v(session):
    resp = await get(session, "https://www.deribit.com/api/v2/public/get_index_price",
                     {"index_name": "dvol_btc"})
    return float(resp["result"]["index_price"])
```

BVIX-D combines three signals: the 25-delta risk reversal from Deribit options (are traders paying more for upside or downside protection?), the perpetual funding rate from Bybit (are longs or shorts paying?), and the put/call open interest ratio. Each is normalized to a -100 to +100 scale and weighted:

```python
async def fetch_bvix_d(session):
    rr_raw  = iv_call_25d - iv_put_25d          # from Deribit options chain
    fr_raw  = float(bybit_ticker["fundingRate"]) # from Bybit perp
    pcr_raw = put_oi / call_oi                   # from Deribit OI

    rr_norm  = float(np.clip(rr_raw  / 5.0   * 100, -100, 100))
    fr_norm  = float(np.clip(fr_raw  / 0.001 * 100, -100, 100))
    pcr_norm = float(np.clip((1.0 - pcr_raw) / 0.5 * 100, -100, 100))

    return 0.40 * rr_norm + 0.35 * fr_norm + 0.25 * pcr_norm
```

High BVIX-V with a strongly positive BVIX-D means the market is pricing in a big move and leaning bullish. Same volatility with a negative BVIX-D and you're looking at the opposite. Low BVIX-V and neither signal tells you much.
