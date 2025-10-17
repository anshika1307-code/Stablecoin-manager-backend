
import { HermesClient } from "@pythnetwork/hermes-client";
import { HERMES_URL, PYTH_PRICE_IDS } from "../utils/constants.js";

const hermes = new HermesClient(HERMES_URL);

/**
 * Fetch latest price feeds for USDT and USDC
 */
export async function fetchStablecoinPrices() {
  try {
    const ids = [PYTH_PRICE_IDS.USDT_USD, PYTH_PRICE_IDS.USDC_USD];

    const latestPriceFeeds = await hermes.getLatestPriceFeeds(ids);

    const formatted = latestPriceFeeds.map((feed) => ({
      id: feed.id,
      productId: feed.productId,
      price: feed.price.price, // raw price (integer, 1e8 scale)
      expo: feed.price.expo,
      conf: feed.price.conf,
      timestamp: feed.price.publishTime,
    }));

    return formatted;
  } catch (err) {
    console.error("Error fetching Pyth prices:", err);
    throw new Error("Failed to fetch price data from Hermes");
  }
}
