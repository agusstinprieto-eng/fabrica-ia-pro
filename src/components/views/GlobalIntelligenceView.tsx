import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import {
    PRODUCTION_VOLUMES,
    STOCK_LEADERS,
    COMMODITIES,
    FUTURE_PROJECTIONS,
    DEMOGRAPHICS,
    CURRENCY_RATES,
    formatLargeNumber,
    getProductionByIndustry,
    getStocksByIndustry,
    getProjectionsByCategory,
    CommodityData,
    CurrencyData
} from '../../services/globalIntelligenceData';
import { fetchLiveMarketData, clearCache } from '../../services/marketDataAPI';

const GlobalIntelligenceView: React.FC = () => {
    const [selectedIndustry, setSelectedIndustry] = useState<string>('automotive');
    const [selectedCategory, setSelectedCategory] = useState<string>('Automation');
    const [commodities, setCommodities] = useState<CommodityData[]>(COMMODITIES);
    const [stocks, setStocks] = useState(STOCK_LEADERS);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Auto-load on mount
    useEffect(() => {
        loadLiveData();
    }, []);

    const loadLiveData = async () => {
        setIsRefreshing(true);
        try {
            const liveData = await fetchLiveMarketData();

            // Update commodities with live prices
            if (liveData.metals) {
                const updatedCommodities = COMMODITIES.map(c => {
                    if (c.name === 'Gold' && liveData.metals?.gold) {
                        return { ...c, price: liveData.metals.gold };
                    }
                    if (c.name === 'Silver' && liveData.metals?.silver) {
                        return { ...c, price: liveData.metals.silver };
                    }
                    return c;
                });
                setCommodities(updatedCommodities);
            }

            // Update stock prices
            if (liveData.stocks) {
                const updatedStocks = STOCK_LEADERS.map(stock => {
                    const livePrice = liveData.stocks[stock.symbol];
                    if (livePrice) {
                        const oldPrice = stock.price;
                        const change = livePrice - oldPrice;
                        const changePercent = (change / oldPrice) * 100;
                        return {
                            ...stock,
                            price: livePrice,
                            change: change,
                            changePercent: changePercent
                        };
                    }
                    return stock;
                });
                setStocks(updatedStocks);
            }

            setLastUpdate(new Date());
            console.log('Live data loaded successfully:', liveData);
        } catch (error) {
            console.error('Failed to load live data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const industries = [
        { id: 'automotive', name: 'Automotive', icon: '🚗' },
        { id: 'aerospace', name: 'Aerospace', icon: '✈️' },
        { id: 'electronics', name: 'Electronics', icon: '📱' },
        { id: 'textile', name: 'Textile', icon: '👕' },
        { id: 'footwear', name: 'Footwear', icon: '👟' },
        { id: 'pharma', name: 'Pharmaceutical', icon: '💊' },
        { id: 'food', name: 'Food & Beverage', icon: '🥤' },
        { id: 'metalworking', name: 'Metalworking', icon: '⚙️' },
    ];

    const projectionCategories = ['Automotive', 'Automation', 'AI Infrastructure', 'Energy'];

    return (
        <div className="h-full p-8 overflow-y-auto bg-cyber-black">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                            <i className="fas fa-globe text-cyber-blue mr-3"></i>
                            Global Manufacturing Intelligence
                        </h2>
                        <p className="text-zinc-500 text-sm">Real-time global data, market intel, and industry forecasts</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <i className="fas fa-clock text-cyber-blue"></i>
                            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                        </div>
                        <button
                            onClick={loadLiveData}
                            disabled={isRefreshing}
                            className="px-4 py-2 bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue rounded-xl font-bold text-xs uppercase hover:bg-cyber-blue hover:text-black transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`}></i>
                            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div>
                </div>

                {/* Production Volumes Section */}
                <div className="bg-cyber-dark border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
                            <i className="fas fa-industry text-cyber-blue"></i>
                            Global Production Volumes
                        </h3>
                        <select
                            value={selectedIndustry}
                            onChange={(e) => setSelectedIndustry(e.target.value)}
                            className="bg-black/50 border border-cyber-blue/30 text-cyber-blue font-bold px-4 py-2 rounded-xl focus:border-cyber-blue outline-none"
                        >
                            {industries.map((ind) => (
                                <option key={ind.id} value={ind.id} className="bg-cyber-black">
                                    {ind.icon} {ind.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {getProductionByIndustry(selectedIndustry as any).map((item, idx) => (
                            <div key={idx} className="bg-black/30 border border-cyber-blue/20 rounded-xl p-4 hover:border-cyber-blue/50 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{item.icon}</span>
                                    <span className="text-xs text-zinc-500">{item.year}</span>
                                </div>
                                <p className="text-sm text-white font-bold mb-1">{item.product}</p>
                                <p className="text-2xl font-black text-cyber-blue">{formatLargeNumber(item.annualProduction)}</p>
                                <p className="text-xs text-zinc-500">{item.unit}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stock Market Leaders */}
                <div className="bg-cyber-dark border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-black text-white uppercase flex items-center gap-2 mb-6">
                        <i className="fas fa-chart-line text-emerald-400"></i>
                        Stock Market Leaders
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {stocks.slice(0, 12).map((stock, idx) => (
                            <div key={idx} className="bg-black/30 border border-white/10 rounded-xl p-4 hover:bg-black/50 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-black text-white">{stock.company}</p>
                                        <p className="text-xs text-zinc-500">{stock.symbol} • {stock.industry}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-white">${stock.price.toFixed(2)}</p>
                                        <p className="text-xs text-zinc-500">{stock.marketCap}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                                    </span>
                                    <span className={`text-xs ${stock.change >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                                        ${Math.abs(stock.change).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Commodities & Materials */}
                <div className="bg-cyber-dark border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-black text-white uppercase flex items-center gap-2 mb-6">
                        <i className="fas fa-coins text-yellow-400"></i>
                        Commodities & Key Materials
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {commodities.map((commodity, idx) => (
                            <div key={idx} className="bg-black/30 border border-yellow-400/20 rounded-xl p-4 hover:border-yellow-400/50 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{commodity.icon}</span>
                                    <p className="text-sm font-bold text-white">{commodity.name}</p>
                                </div>
                                <p className="text-2xl font-black text-yellow-400">${commodity.price.toLocaleString()}</p>
                                <p className="text-xs text-zinc-500 mb-2">{commodity.unit}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${commodity.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {commodity.change24h >= 0 ? '▲' : '▼'} {Math.abs(commodity.changePercent).toFixed(2)}%
                                    </span>
                                    <span className="text-xs text-zinc-500">24h</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Future Projections */}
                <div className="bg-cyber-dark border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
                            <i className="fas fa-rocket text-purple-400"></i>
                            Future of Manufacturing (2024-2040)
                        </h3>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-black/50 border border-purple-400/30 text-purple-400 font-bold px-4 py-2 rounded-xl focus:border-purple-400 outline-none"
                        >
                            {projectionCategories.map((cat) => (
                                <option key={cat} value={cat} className="bg-cyber-black">{cat}</option>
                            ))}
                        </select>
                    </div>

                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={getProjectionsByCategory(selectedCategory).map(proj => ({
                                name: proj.item,
                                '2024': proj.current,
                                '2030': proj.projected2030,
                                '2040': proj.projected2040
                            }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                dataKey="name"
                                stroke="#00d4ff"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                            />
                            <YAxis
                                stroke="#00d4ff"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => formatLargeNumber(value)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #00d4ff',
                                    borderRadius: '8px'
                                }}
                                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                formatter={(value: any) => [formatLargeNumber(value), '']}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="line"
                            />
                            <Line type="monotone" dataKey="2024" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff' }} />
                            <Line type="monotone" dataKey="2030" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee' }} />
                            <Line type="monotone" dataKey="2040" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* World Demographics */}
                <div className="bg-cyber-dark border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-black text-white uppercase flex items-center gap-2 mb-6">
                        <i className="fas fa-users text-cyan-400"></i>
                        World Population Forecast (2024-2040)
                    </h3>

                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            data={DEMOGRAPHICS}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                dataKey="continent"
                                stroke="#00d4ff"
                                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#00d4ff"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => formatLargeNumber(value)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #00d4ff',
                                    borderRadius: '8px'
                                }}
                                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                formatter={(value: any) => [formatLargeNumber(value), '']}
                            />
                            <Legend />
                            <Bar dataKey="population2024" fill="#00d4ff" name="2024 Population" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="projected2040" fill="#22d3ee" name="2040 Projected" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                        {DEMOGRAPHICS.map((demo, idx) => (
                            <div key={idx} className="bg-black/30 border border-cyan-400/20 rounded-xl p-3 text-center">
                                <p className="text-xs text-zinc-500 mb-1">{demo.continent}</p>
                                <p className={`text-sm font-black ${demo.growthPercent >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                    {demo.growthPercent >= 0 ? '📈' : '📉'} {Math.abs(demo.growthPercent).toFixed(1)}%
                                </p>
                                <p className="text-xs text-zinc-500">Growth</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Currency Exchange Rates - Forex */}
                <div className="bg-cyber-dark border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-black text-white uppercase flex items-center gap-2 mb-6">
                        <i className="fas fa-exchange-alt text-emerald-400"></i>
                        Currency Exchange Rates (vs USD)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {CURRENCY_RATES.map((currency, idx) => (
                            <div key={idx} className="bg-black/30 border border-emerald-400/20 rounded-xl p-4 hover:border-emerald-400/50 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{currency.flag}</span>
                                        <div>
                                            <p className="text-sm font-black text-white">{currency.country}</p>
                                            <p className="text-xs text-zinc-500">{currency.code}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-emerald-400">{currency.rateToUSD.toLocaleString()}</p>
                                        <p className="text-xs text-zinc-500">{currency.currency}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <span className="text-xs text-zinc-500">24h Change:</span>
                                    <span className={`text-xs font-bold ${currency.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {currency.change24h >= 0 ? '▲' : '▼'} {Math.abs(currency.change24h).toFixed(3)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Data Sources Footer */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-500">
                        <i className="fas fa-info-circle text-cyber-blue mr-2"></i>
                        Data sources: World Bank, UN Statistics, Industry Reports, Market Research • Updated daily
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GlobalIntelligenceView;
