import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Proxy endpoint for Yahoo Finance stock prices
app.get('/api/stock/:symbol', async (req, res) => {
    const { symbol } = req.params;

    try {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
        );

        if (!response.ok) {
            throw new Error(`Yahoo Finance returned ${response.status}`);
        }

        const data = await response.json();
        const price = data.chart.result[0].meta.regularMarketPrice;

        res.json({ symbol, price });
    } catch (error) {
        console.error(`Error fetching stock ${symbol}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for multiple stocks
app.post('/api/stocks', async (req, res) => {
    const { symbols } = req.body;

    if (!Array.isArray(symbols)) {
        return res.status(400).json({ error: 'symbols must be an array' });
    }

    try {
        const promises = symbols.map(async (symbol) => {
            try {
                const response = await fetch(
                    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
                );
                const data = await response.json();
                const price = data.chart.result[0].meta.regularMarketPrice;
                return { symbol, price };
            } catch (err) {
                return { symbol, price: null, error: err.message };
            }
        });

        const results = await Promise.all(promises);
        res.json({ stocks: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for metals (gold, silver)
app.get('/api/metals', async (req, res) => {
    try {
        // Using a free metals API - adjust endpoint as needed
        const response = await fetch(
            'https://api.metals.live/v1/spot'
        );

        if (!response.ok) {
            throw new Error('Metals API failed');
        }

        const data = await response.json();

        res.json({
            gold: data.gold || 4600,
            silver: data.silver || 90,
        });
    } catch (error) {
        console.error('Error fetching metals:', error);
        // Fallback to static values
        res.json({ gold: 4600, silver: 90 });
    }
});

// Proxy endpoint for forex rates
app.get('/api/forex', async (req, res) => {
    try {
        // Using exchangerate-api.com free tier
        const response = await fetch(
            'https://api.exchangerate-api.com/v4/latest/USD'
        );

        if (!response.ok) {
            throw new Error('Forex API failed');
        }

        const data = await response.json();

        res.json({
            rates: {
                CNY: data.rates.CNY,
                JPY: data.rates.JPY,
                RUB: data.rates.RUB,
                EUR: data.rates.EUR,
                INR: data.rates.INR,
                MXN: data.rates.MXN,
                TRY: data.rates.TRY,
                PLN: data.rates.PLN,
                BDT: data.rates.BDT,
                VND: data.rates.VND,
            },
        });
    } catch (error) {
        console.error('Error fetching forex:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3100;

app.listen(PORT, () => {
    console.log(`🚀 Market Data API Proxy running on http://localhost:${PORT}`);
    console.log(`📊 Endpoints available:`);
    console.log(`   GET  /api/stock/:symbol`);
    console.log(`   POST /api/stocks (with {symbols: []})`);
    console.log(`   GET  /api/metals`);
    console.log(`   GET  /api/forex`);
});

export default app;
