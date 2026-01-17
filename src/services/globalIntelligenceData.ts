// Global Intelligence Data Service
// Provides curated global manufacturing, market, and economic data

export interface ProductionData {
    industry: 'automotive' | 'aerospace' | 'electronics' | 'textile' | 'footwear' | 'pharma' | 'food' | 'metalworking';
    product: string;
    annualProduction: number;
    unit: string;
    year: number;
    icon: string;
}

export interface StockData {
    symbol: string;
    company: string;
    industry: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: string;
}

export interface CommodityData {
    name: string;
    price: number;
    unit: string;
    change24h: number;
    changePercent: number;
    icon: string;
}

export interface FutureProjection {
    category: string;
    item: string;
    current: number;
    projected2030: number;
    projected2040: number;
    unit: string;
    icon: string;
}

export interface DemographicData {
    continent: string;
    population2024: number;
    projected2040: number;
    growthPercent: number;
}

export interface CurrencyData {
    country: string;
    currency: string;
    code: string;
    rateToUSD: number;
    change24h: number;
    flag: string;
}

export interface GDPData {
    country: string;
    code: string;
    gdp: number; // Trillions
    color: string;
}

export interface RegionalShareData {
    region: string;
    share: number;
    color: string;
}

export interface MaterialConsumptionData {
    material: string;
    dailyAmount: number;
    unit: string;
    capacity: number; // for progress bar
    color: string;
}

export interface GDPData {
    country: string;
    code: string;
    gdp: number; // Trillions
    color: string;
}

export interface RegionalShareData {
    region: string;
    share: number;
    color: string;
}

export interface MaterialConsumptionData {
    material: string;
    dailyAmount: number;
    unit: string;
    capacity: number; // for progress bar
    color: string;
}

// Global Production Volumes (Annual, 2024 estimates)
export const PRODUCTION_VOLUMES: ProductionData[] = [
    // Automotive
    { industry: 'automotive', product: 'Passenger Vehicles', annualProduction: 85000000, unit: 'units/year', year: 2024, icon: '🚗' },
    { industry: 'automotive', product: 'Electric Vehicles', annualProduction: 14000000, unit: 'units/year', year: 2024, icon: '🔋' },

    // Aerospace
    { industry: 'aerospace', product: 'Commercial Aircraft', annualProduction: 1800, unit: 'units/year', year: 2024, icon: '✈️' },
    { industry: 'aerospace', product: 'Military Aircraft', annualProduction: 650, unit: 'units/year', year: 2024, icon: '🛩️' },

    // Electronics
    { industry: 'electronics', product: 'Smartphones', annualProduction: 1400000000, unit: 'units/year', year: 2024, icon: '📱' },
    { industry: 'electronics', product: 'Laptops & PCs', annualProduction: 280000000, unit: 'units/year', year: 2024, icon: '💻' },
    { industry: 'electronics', product: 'Tablets', annualProduction: 160000000, unit: 'units/year', year: 2024, icon: '📟' },

    // Textile
    { industry: 'textile', product: 'Jeans', annualProduction: 2000000000, unit: 'units/year', year: 2024, icon: '👖' },
    { industry: 'textile', product: 'T-Shirts', annualProduction: 4500000000, unit: 'units/year', year: 2024, icon: '👕' },

    // Footwear
    { industry: 'footwear', product: 'Athletic Shoes', annualProduction: 1200000000, unit: 'pairs/year', year: 2024, icon: '👟' },
    { industry: 'footwear', product: 'All Footwear', annualProduction: 24000000000, unit: 'pairs/year', year: 2024, icon: '👞' },

    // Pharmaceutical
    { industry: 'pharma', product: 'Generic Drugs', annualProduction: 450000, unit: 'tons/year', year: 2024, icon: '💊' },
    { industry: 'pharma', product: 'Vaccines', annualProduction: 5500000000, unit: 'doses/year', year: 2024, icon: '💉' },

    // Food & Beverage
    { industry: 'food', product: 'Soft Drinks', annualProduction: 185000000000, unit: 'liters/year', year: 2024, icon: '🥤' },
    { industry: 'food', product: 'Beer', annualProduction: 195000000000, unit: 'liters/year', year: 2024, icon: '🍺' },
    { industry: 'food', product: 'Packaged Foods', annualProduction: 2100000000, unit: 'tons/year', year: 2024, icon: '🥣' },

    // Metalworking
    { industry: 'metalworking', product: 'Steel', annualProduction: 1950000000, unit: 'tons/year', year: 2024, icon: '🏗️' },
    { industry: 'metalworking', product: 'Aluminum', annualProduction: 68000000, unit: 'tons/year', year: 2024, icon: '⚙️' },
];

// Stock Market Leaders by Industry
export const STOCK_LEADERS: StockData[] = [
    // Automotive
    { symbol: 'TSLA', company: 'Tesla', industry: 'automotive', price: 248.50, change: 5.20, changePercent: 2.14, marketCap: '$789B' },
    { symbol: 'TM', company: 'Toyota Motor', industry: 'automotive', price: 182.30, change: -1.10, changePercent: -0.60, marketCap: '$245B' },
    { symbol: 'F', company: 'Ford Motor', industry: 'automotive', price: 12.45, change: 0.25, changePercent: 2.05, marketCap: '$49B' },

    // Aerospace
    { symbol: 'BA', company: 'Boeing', industry: 'aerospace', price: 178.90, change: -2.30, changePercent: -1.27, marketCap: '$110B' },
    { symbol: 'LMT', company: 'Lockheed Martin', industry: 'aerospace', price: 485.60, change: 3.40, changePercent: 0.71, marketCap: '$122B' },

    // Electronics
    { symbol: 'AAPL', company: 'Apple', industry: 'electronics', price: 192.45, change: 1.85, changePercent: 0.97, marketCap: '$2.98T' },
    { symbol: 'NVDA', company: 'NVIDIA', industry: 'electronics', price: 495.20, change: 12.30, changePercent: 2.55, marketCap: '$1.22T' },
    { symbol: 'TSM', company: 'TSMC', industry: 'electronics', price: 98.75, change: 2.10, changePercent: 2.17, marketCap: '$512B' },

    // Textile/Footwear
    { symbol: 'NKE', company: 'Nike', industry: 'footwear', price: 104.25, change: -0.75, changePercent: -0.71, marketCap: '$161B' },
    { symbol: 'ADDYY', company: 'Adidas', industry: 'footwear', price: 118.30, change: 1.90, changePercent: 1.63, marketCap: '$45B' },

    // Pharmaceutical
    { symbol: 'PFE', company: 'Pfizer', industry: 'pharma', price: 28.65, change: 0.15, changePercent: 0.53, marketCap: '$161B' },
    { symbol: 'JNJ', company: 'Johnson & Johnson', industry: 'pharma', price: 158.40, change: -0.90, changePercent: -0.56, marketCap: '$383B' },

    // Food & Beverage
    { symbol: 'KO', company: 'Coca-Cola', industry: 'food', price: 62.80, change: 0.45, changePercent: 0.72, marketCap: '$272B' },
    { symbol: 'PEP', company: 'PepsiCo', industry: 'food', price: 175.90, change: 1.20, changePercent: 0.69, marketCap: '$243B' },

    // Industrial/Manufacturing
    { symbol: 'GE', company: 'General Electric', industry: 'metalworking', price: 168.50, change: 2.80, changePercent: 1.69, marketCap: '$185B' },
    { symbol: 'HON', company: 'Honeywell', industry: 'metalworking', price: 208.30, change: 1.50, changePercent: 0.73, marketCap: '$138B' },
    { symbol: 'RIO', company: 'Rio Tinto', industry: 'metalworking', price: 68.45, change: -0.35, changePercent: -0.51, marketCap: '$110B' },
    { symbol: 'X', company: 'U.S. Steel', industry: 'metalworking', price: 38.90, change: 0.15, changePercent: 0.39, marketCap: '$8.7B' },
];

// GDP Leaders (2024 Est.)
export const GDP_LEADERS: GDPData[] = [
    { country: 'USA', code: 'USA', gdp: 28.0, color: '#3b82f6' }, // Blue
    { country: 'China', code: 'CHN', gdp: 19.0, color: '#ef4444' }, // Red
    { country: 'Germany', code: 'DEU', gdp: 4.5, color: '#eab308' }, // Yellow
    { country: 'Japan', code: 'JPN', gdp: 4.2, color: '#ffffff' }, // White
    { country: 'India', code: 'IND', gdp: 3.9, color: '#f97316' }, // Orange
];

// Regional GDP Share
export const GDP_REGIONAL_SHARE: RegionalShareData[] = [
    { region: 'North America', share: 35, color: '#3b82f6' },
    { region: 'Asia', share: 30, color: '#ef4444' },
    { region: 'Europe', share: 20, color: '#eab308' },
    { region: 'Other', share: 15, color: '#22c55e' },
];

// Daily Material Consumption (Global Est.)
export const MATERIAL_CONSUMPTION: MaterialConsumptionData[] = [
    { material: 'Steel', dailyAmount: 5.1, unit: 'M tons', capacity: 6.0, color: '#60a5fa' },
    { material: 'Aluminum', dailyAmount: 180, unit: 'K tons', capacity: 300, color: '#9ca3af' },
    { material: 'Fabric', dailyAmount: 300, unit: 'M meters', capacity: 350, color: '#c084fc' },
    { material: 'Gold', dailyAmount: 10, unit: 'tons', capacity: 15, color: '#fbbf24' },
    { material: 'Silver', dailyAmount: 70, unit: 'tons', capacity: 100, color: '#94a3b8' },
];

// Commodities & Key Materials
export const COMMODITIES: CommodityData[] = [
    { name: 'Gold', price: 4600.00, unit: 'USD/oz', change24h: 45.30, changePercent: 0.99, icon: '🥇' },
    { name: 'Silver', price: 90.00, unit: 'USD/oz', change24h: 2.15, changePercent: 2.45, icon: '🥈' },
    { name: 'Crude Oil (WTI)', price: 73.20, unit: 'USD/barrel', change24h: -1.10, changePercent: -1.48, icon: '🛢️' },
    { name: 'Natural Gas', price: 2.85, unit: 'USD/MMBtu', change24h: 0.08, changePercent: 2.89, icon: '⚡' },
    { name: 'Copper', price: 8450.00, unit: 'USD/ton', change24h: 125.00, changePercent: 1.50, icon: '🔶' },
    { name: 'Aluminum', price: 2280.00, unit: 'USD/ton', change24h: -15.00, changePercent: -0.65, icon: '⚙️' },
    { name: 'Silicon Wafer', price: 950.00, unit: 'USD/wafer', change24h: 5.00, changePercent: 0.53, icon: '💾' },
    { name: 'Microchip (avg)', price: 12.50, unit: 'USD/unit', change24h: -0.20, changePercent: -1.57, icon: '🖥️' },
];

// Future Industry Projections
export const FUTURE_PROJECTIONS: FutureProjection[] = [
    // Electric Vehicles
    { category: 'Automotive', item: 'Electric Vehicles', current: 14000000, projected2030: 45000000, projected2040: 85000000, unit: 'units/year', icon: '🔋' },

    // Robots
    { category: 'Automation', item: 'Industrial Robots', current: 580000, projected2030: 1200000, projected2040: 2500000, unit: 'units/year', icon: '🤖' },
    { category: 'Automation', item: 'Collaborative Robots', current: 42000, projected2030: 250000, projected2040: 650000, unit: 'units/year', icon: '🦾' },
    { category: 'Automation', item: 'Service Robots', current: 180000, projected2030: 850000, projected2040: 2100000, unit: 'units/year', icon: '🦿' },
    { category: 'Automation', item: 'Warehouse Robots', current: 95000, projected2030: 480000, projected2040: 1200000, unit: 'units/year', icon: '📦' },

    // AI Infrastructure
    { category: 'AI Infrastructure', item: 'Data Centers', current: 8500, projected2030: 15000, projected2040: 28000, unit: 'facilities', icon: '🏢' },
    { category: 'AI Infrastructure', item: 'AI Accelerator Chips', current: 3500000, projected2030: 28000000, projected2040: 95000000, unit: 'units/year', icon: '🧠' },
    { category: 'AI Infrastructure', item: 'GPU Computing Power', current: 450, projected2030: 3500, projected2040: 15000, unit: 'ExaFLOPS', icon: '💻' },

    // Renewable Energy
    { category: 'Energy', item: 'Solar Panels', current: 380000, projected2030: 950000, projected2040: 1850000, unit: 'MW/year', icon: '☀️' },
    { category: 'Energy', item: 'Wind Turbines', current: 115000, projected2030: 280000, projected2040: 520000, unit: 'MW/year', icon: '💨' },
];

// World Population by Continent
export const DEMOGRAPHICS: DemographicData[] = [
    { continent: 'Asia', population2024: 4751000000, projected2040: 5050000000, growthPercent: 6.29 },
    { continent: 'Africa', population2024: 1460000000, projected2040: 2100000000, growthPercent: 43.84 },
    { continent: 'Europe', population2024: 745000000, projected2040: 710000000, growthPercent: -4.70 },
    { continent: 'North America', population2024: 597000000, projected2040: 670000000, growthPercent: 12.23 },
    { continent: 'South America', population2024: 439000000, projected2040: 480000000, growthPercent: 9.34 },
    { continent: 'Oceania', population2024: 45000000, projected2040: 57000000, growthPercent: 26.67 },
];

// Currency Exchange Rates (vs USD) - 11 Key Manufacturing Countries
export const CURRENCY_RATES: CurrencyData[] = [
    { country: 'China', currency: 'Yuan', code: 'CNY', rateToUSD: 7.24, change24h: -0.12, flag: '🇨🇳' },
    { country: 'Bangladesh', currency: 'Taka', code: 'BDT', rateToUSD: 109.50, change24h: 0.25, flag: '🇧🇩' },
    { country: 'Vietnam', currency: 'Dong', code: 'VND', rateToUSD: 24350.00, change24h: -85.00, flag: '🇻🇳' },
    { country: 'India', currency: 'Rupee', code: 'INR', rateToUSD: 83.12, change24h: 0.15, flag: '🇮🇳' },
    { country: 'Mexico', currency: 'Peso', code: 'MXN', rateToUSD: 17.15, change24h: -0.08, flag: '🇲🇽' },
    { country: 'Turkey', currency: 'Lira', code: 'TRY', rateToUSD: 32.45, change24h: 0.35, flag: '🇹🇷' },
    { country: 'Portugal', currency: 'Euro', code: 'EUR', rateToUSD: 0.92, change24h: -0.005, flag: '🇵🇹' },
    { country: 'Poland', currency: 'Zloty', code: 'PLN', rateToUSD: 4.02, change24h: 0.02, flag: '🇵🇱' },
    { country: 'USA', currency: 'Dollar', code: 'USD', rateToUSD: 1.00, change24h: 0.00, flag: '🇺🇸' },
    { country: 'Japan', currency: 'Yen', code: 'JPY', rateToUSD: 148.25, change24h: -0.85, flag: '🇯🇵' },
    { country: 'Russia', currency: 'Ruble', code: 'RUB', rateToUSD: 92.50, change24h: 1.20, flag: '🇷🇺' },
];

// Helper function to format large numbers
export const formatLargeNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toString();
};

// Get production data by industry
export const getProductionByIndustry = (industry: ProductionData['industry']): ProductionData[] => {
    return PRODUCTION_VOLUMES.filter(p => p.industry === industry);
};

// Get stocks by industry
export const getStocksByIndustry = (industry: string): StockData[] => {
    return STOCK_LEADERS.filter(s => s.industry === industry);
};

// Get projections by category
export const getProjectionsByCategory = (category: string): FutureProjection[] => {
    return FUTURE_PROJECTIONS.filter(p => p.category === category);
};
