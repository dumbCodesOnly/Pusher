const express = require("express");
const Pusher = require("pusher");
const WebSocket = require("ws");
const path = require("path");

const app = express();

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

// Pusher configuration (set these in Render environment variables)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Binance watchlist
const watchlist = ["btcusdt","ethusdt","solusdt","bnbusdt","adausdt","xrpusdt","dogeusdt","dotusdt","linkusdt"];

// Combined Binance WebSocket stream
const wsUrl = `wss://stream.binance.com:9443/stream?streams=${watchlist.map(s => s+"@trade").join("/")}`;
const ws = new WebSocket(wsUrl);

let latestPrices = {};

ws.on("open", () => console.log("✅ Connected to Binance WebSocket"));
ws.on("message", msg => {
  try {
    const payload = JSON.parse(msg);
    const data = payload.data;
    const symbol = data.s.replace("USDT","");
    const price = parseFloat(data.p);
    latestPrices[symbol] = price;

    // Push update via Pusher
    pusher.trigger("crypto-channel", "prices-update", latestPrices);
  } catch(err) {
    console.error("WebSocket message error:", err.message);
  }
});

// Serve frontend page
app.get("/", (req,res) => res.sendFile(path.join(__dirname,"frontend","index.html")));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
