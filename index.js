import express, { json } from "express";
import cors from "cors";
import "dotenv/config";
 

const app = express();
app.use(cors());
app.use(json());

app.get("/swapInfo", (req, res) => {
  try {
    const swapAddress = process.env.SWAP_ADDRESS;
    const swapAbi = [
      "function swap(address fromToken, address toToken, uint256 amount) external"
    ];
    res.json({ swapAddress, swapAbi });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`backend running on port ${PORT}`));