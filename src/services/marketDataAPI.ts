import { COMMODITIES, STOCK_LEADERS, CURRENCY_RATES } from './globalIntelligenceData';

// Market Data API Service - Simulation Mode
// Generates realistic random walk data for demonstration purposes
// Replaces broken external APIs with robust client-side math

const CACHE_DURATION_MS = 5 * 1000; // 5 seconds cache to allow quick refreshes

interface CachedData<T> {
    data: T;
    timestamp: number;
}

// Get cached data or null if expired
function getCached<T>(key: string): T | null {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const cached: CachedData<T> = JSON.parse(item);
        if (Date.now() - cached.timestamp > CACHE_DURATION_MS) {
            localStorage.removeItem(key);
            return null;
        }

        return cached.data;
    } catch {
        return null;
    }
}

// Save to cache
function setCache<T>(key: string, data: T): void {
    try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
        console.error('Cache error:', e);
    }
}

// Random Walk Generator
// Uses Box-Muller transform for normal distribution to create realistic market movements
const generateRandomWalk = (currentPrice: number, volatility: number = 0.02): number => {
    // Generate random normal distribution (Gaussian)
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    // Calculate fractional movement
    const change = volatility * z;

    // New price = current * (1 + change)
    const newPrice = currentPrice * (1 + change);

    // Ensure reasonable bounds (never drop > 50% or grow > 200% from base in one step)
    // Realistically for this demo, we just want it to drift slightly
    return Number(newPrice.toFixed(2));
};

// Simulate Metals Prices
export async function fetchMetalsPrices(): Promise<{ gold: number; silver: number; copper: number; aluminum: number } | null> {
    const cached = getCached<{ gold: number; silver: number; copper: number; aluminum: number }>('metals_live');
    if (cached) return cached; // Return cache if valid (simulates data stability for a few seconds)

    // Base prices from COMMODITIES constant + random initial drift if first load
    // But here we want to modify them dynamically.
    // For simulation, we'll grab the base values and apply a random walk.

    // Define base prices (reference)
    const basePrices = {
        gold: 4600.00,
        silver: 90.00,
        copper: 8450.00,
        aluminum: 2280.00
    };

    // Calculate new simulated prices
    // Volatility is low (0.5% to 1.5%) to look realistic
    const prices = {
        gold: generateRandomWalk(basePrices.gold, 0.008),
        silver: generateRandomWalk(basePrices.silver, 0.012),
        copper: generateRandomWalk(basePrices.copper, 0.010),
        aluminum: generateRandomWalk(basePrices.aluminum, 0.009),
    };

    setCache('metals_live', prices);
    return prices;
}

// Fetch Stock Prices (Simulated)
export async function fetchStockPrice(symbol: string): Promise<number | null> {
    const stock = STOCK_LEADERS.find(s => s.symbol === symbol);
    if (!stock) return null;

    const cacheKey = `stock_sim_${symbol}`;
    const cached = getCached<number>(cacheKey);
    if (cached) return cached;

    // Simulate price
    const price = generateRandomWalk(stock.price, 0.015); // Stocks are slightly more volatile
    setCache(cacheKey, price);
    return price;
}

// Fetch multiple stocks at once
export async function fetchMultipleStocks(symbols: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    // Using a slight delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 300));

    symbols.forEach(symbol => {
        const stock = STOCK_LEADERS.find(s => s.symbol === symbol);
        if (stock) {
            // Check cache or generate
            const cacheKey = `stock_sim_${symbol}`;
            let price = getCached<number>(cacheKey);

            if (!price) {
                // Apply random walk to the BASE price defined in constants
                // This ensures we always drift from a "sane" value
                price = generateRandomWalk(stock.price, 0.02);
                setCache(cacheKey, price);
            }

            prices.set(symbol, price);
        }
    });

    return prices;
}

// Fetch forex rates (Simulated)
export async function fetchForexRates(): Promise<Record<string, number> | null> {
    const cached = getCached<Record<string, number>>('forex_rates_sim');
    if (cached) return cached;

    const rates: Record<string, number> = {};

    CURRENCY_RATES.forEach(curr => {
        if (curr.code !== 'USD') {
            // Forex is usually low volatility
            rates[curr.code] = generateRandomWalk(curr.rateToUSD, 0.003);
        }
    });

    setCache('forex_rates_sim', rates);
    return rates;
}

// Unified data fetch
export async function fetchLiveMarketData() {
    console.log('Generating simulated live market data...');

    // Force delay for UX (spinner visibility)
    await new Promise(resolve => setTimeout(resolve, 600));

    const stockSymbols = STOCK_LEADERS.map(s => s.symbol);

    const [metals, stocksMap, forex] = await Promise.all([
        fetchMetalsPrices(),
        fetchMultipleStocks(stockSymbols),
        fetchForexRates(),
    ]);

    const stocks: Record<string, number | null> = {};
    stockSymbols.forEach(symbol => {
        stocks[symbol] = stocksMap.get(symbol) || null;
    });

    return {
        metals,
        stocks,
        forex,
        timestamp: new Date().toISOString(),
    };
}

export function clearCache(): void {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('metals_') || key.startsWith('stock_') || key.startsWith('forex_')) {
            localStorage.removeItem(key);
        }
    });
}
