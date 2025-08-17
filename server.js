const express = require("express");
const axios = require("axios");
const Pusher = require("pusher");

const app = express();

// Pusher config (set these in Render env variables)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Your watchlist
const watchlist = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "ADAUSDT",
  "XRPUSDT",
  "DOGEUSDT",
  "DOTUSDT",
  "LINKUSDT"
];

async function fetchAndPush() {
  try {
    // Get ALL tickers from Binance
    const { data } = await axios.get("https://api.binance.com/api/v3/ticker/price");

    // Filter for only the coins we care about
    const prices = data
      .filter(item => watchlist.includes(item.symbol))
      .map(item => ({
        symbol: item.symbol.replace("USDT", ""), // strip "USDT"
        price: parseFloat(item.price)
      }));

    // Send to Pusher
    pusher.trigger("crypto-channel", "prices-update", prices);
    console.log("Sent prices:", prices);
  } catch (err) {
    console.error("Error fetching Binance data:", err.message);
  }
}

// Fetch every 5 seconds
setInterval(fetchAndPush, 5000);
fetchAndPush();

app.get("/", (req, res) => res.send("✅ Binance crypto price backend running"));

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server running on ${port}`));
