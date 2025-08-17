const express = require("express");
const axios = require("axios");
const Pusher = require("pusher");

const app = express();

// Configure Pusher with env vars
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Map CoinGecko IDs to symbols
const coinMap = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  binancecoin: "BNB",
  cardano: "ADA",
  ripple: "XRP",
  dogecoin: "DOGE",
  polkadot: "DOT",
  chainlink: "LINK"
};

// Fetch & push to Pusher
async function fetchAndPush() {
  try {
    const ids = Object.keys(coinMap).join(",");
    const url = "https://api.coingecko.com/api/v3/simple/price";
    const { data } = await axios.get(url, {
      params: { ids, vs_currencies: "usd" }
    });

    // Restructure for frontend
    const prices = Object.entries(data).map(([id, val]) => ({
      symbol: coinMap[id],
      price: val.usd
    }));

    // Send via Pusher
    pusher.trigger("crypto-channel", "prices-update", prices);
    console.log("Sent prices:", prices);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

// Fetch every 5 seconds
setInterval(fetchAndPush, 5000);
fetchAndPush();

app.get("/", (req, res) => res.send("✅ Crypto price backend running"));

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server on port ${port}`));
