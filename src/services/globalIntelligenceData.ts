// Global Intelligence Data Service
// Provides curated global manufacturing, market, and economic data

export interface ProductionData {
    industry: 'automotive' | 'aerospace' | 'electronics' | 'textile' | 'footwear' | 'pharma' | 'food' | 'metalworking' | 'medical_devices' | 'energy';
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

// Global Production Volumes (Annual, 2026 Projections)
export const PRODUCTION_VOLUMES: ProductionData[] = [
    // Automotive
    { industry: 'automotive', product: 'Passenger Vehicles', annualProduction: 88000000, unit: 'units/year', year: 2026, icon: '🚗' },
    { industry: 'automotive', product: 'Electric Vehicles', annualProduction: 22000000, unit: 'units/year', year: 2026, icon: '🔋' },

    // Aerospace
    { industry: 'aerospace', product: 'Commercial Aircraft', annualProduction: 2100, unit: 'units/year', year: 2026, icon: '✈️' },
    { industry: 'aerospace', product: 'Military Aircraft', annualProduction: 720, unit: 'units/year', year: 2026, icon: '🛩️' },

    // Electronics
    { industry: 'electronics', product: 'Smartphones', annualProduction: 1450000000, unit: 'units/year', year: 2026, icon: '📱' },
    { industry: 'electronics', product: 'Laptops & PCs', annualProduction: 295000000, unit: 'units/year', year: 2026, icon: '💻' },
    { industry: 'electronics', product: 'Tablets', annualProduction: 155000000, unit: 'units/year', year: 2026, icon: '📟' },
    { industry: 'electronics', product: 'AI Chips (GPU/NPU)', annualProduction: 8500000, unit: 'units/year', year: 2026, icon: '🧠' },

    // Textile
    { industry: 'textile', product: 'Jeans', annualProduction: 2100000000, unit: 'units/year', year: 2026, icon: '👖' },
    { industry: 'textile', product: 'T-Shirts', annualProduction: 4700000000, unit: 'units/year', year: 2026, icon: '👕' },

    // Footwear
    { industry: 'footwear', product: 'Athletic Shoes', annualProduction: 1350000000, unit: 'pairs/year', year: 2026, icon: '👟' },
    { industry: 'footwear', product: 'All Footwear', annualProduction: 25500000000, unit: 'pairs/year', year: 2026, icon: '👞' },

    // Pharmaceutical
    { industry: 'pharma', product: 'Generic Drugs', annualProduction: 480000, unit: 'tons/year', year: 2026, icon: '💊' },
    { industry: 'pharma', product: 'Vaccines', annualProduction: 6200000000, unit: 'doses/year', year: 2026, icon: '💉' },

    // Food & Beverage
    { industry: 'food', product: 'Soft Drinks', annualProduction: 195000000000, unit: 'liters/year', year: 2026, icon: '🥤' },
    { industry: 'food', product: 'Beer', annualProduction: 205000000000, unit: 'liters/year', year: 2026, icon: '🍺' },
    { industry: 'food', product: 'Packaged Foods', annualProduction: 2250000000, unit: 'tons/year', year: 2026, icon: '🥣' },

    // Metalworking
    { industry: 'metalworking', product: 'Steel', annualProduction: 2050000000, unit: 'tons/year', year: 2026, icon: '🏗️' },
    { industry: 'metalworking', product: 'Aluminum', annualProduction: 74000000, unit: 'tons/year', year: 2026, icon: '⚙️' },

    // Medical Devices
    { industry: 'medical_devices', product: 'Surgical Instruments', annualProduction: 1400000, unit: 'units/year', year: 2026, icon: '🔪' },
    { industry: 'medical_devices', product: 'Diagnostic Equipment', annualProduction: 520000, unit: 'units/year', year: 2026, icon: '🩺' },
    { industry: 'medical_devices', product: 'Implantable Devices', annualProduction: 9200000, unit: 'units/year', year: 2026, icon: '💓' },

    // Energy
    { industry: 'energy', product: 'Solar Inverters', annualProduction: 3500000, unit: 'units/year', year: 2026, icon: '☀️' },
    { industry: 'energy', product: 'Wind Turbine Components', annualProduction: 62000, unit: 'units/year', year: 2026, icon: '🌬️' },
    { industry: 'energy', product: 'Industrial Batteries', annualProduction: 1200000000, unit: 'kWh/year', year: 2026, icon: '🔋' },
];

// Stock Market Leaders by Industry (2026 Projections)
export const STOCK_LEADERS: StockData[] = [
    // Automotive
    { symbol: 'TSLA', company: 'Tesla', industry: 'automotive', price: 320.50, change: 12.40, changePercent: 4.02, marketCap: '$1.1T' },
    { symbol: 'TM', company: 'Toyota Motor', industry: 'automotive', price: 195.80, change: 1.50, changePercent: 0.77, marketCap: '$275B' },
    { symbol: 'BYD', company: 'BYD Co.', industry: 'automotive', price: 85.20, change: 3.40, changePercent: 4.15, marketCap: '$140B' },

    // Aerospace
    { symbol: 'BA', company: 'Boeing', industry: 'aerospace', price: 210.45, change: 5.30, changePercent: 2.58, marketCap: '$135B' },
    { symbol: 'LMT', company: 'Lockheed Martin', industry: 'aerospace', price: 520.10, change: 4.20, changePercent: 0.81, marketCap: '$130B' },

    // Electronics & AI
    { symbol: 'NVDA', company: 'NVIDIA', industry: 'electronics', price: 850.00, change: 45.20, changePercent: 5.61, marketCap: '$2.8T' },
    { symbol: 'AAPL', company: 'Apple', industry: 'electronics', price: 215.50, change: 3.20, changePercent: 1.50, marketCap: '$3.4T' },
    { symbol: 'TSM', company: 'TSMC', industry: 'electronics', price: 145.80, change: 5.60, changePercent: 3.99, marketCap: '$820B' },

    // Textile/Footwear
    { symbol: 'NKE', company: 'Nike', industry: 'footwear', price: 115.60, change: 1.20, changePercent: 1.05, marketCap: '$178B' },
    { symbol: 'LULU', company: 'Lululemon', industry: 'textile', price: 485.30, change: 6.50, changePercent: 1.36, marketCap: '$65B' },

    // Pharmaceutical
    { symbol: 'LLY', company: 'Eli Lilly', industry: 'pharma', price: 780.40, change: 12.50, changePercent: 1.63, marketCap: '$750B' },
    { symbol: 'NVO', company: 'Novo Nordisk', industry: 'pharma', price: 145.20, change: 2.80, changePercent: 1.96, marketCap: '$620B' },

    // Food & Beverage
    { symbol: 'KO', company: 'Coca-Cola', industry: 'food', price: 68.50, change: 0.60, changePercent: 0.88, marketCap: '$295B' },
    { symbol: 'PEP', company: 'PepsiCo', industry: 'food', price: 185.20, change: 1.10, changePercent: 0.60, marketCap: '$255B' },

    // Industrial/Manufacturing
    { symbol: 'CAT', company: 'Caterpillar', industry: 'metalworking', price: 340.50, change: 5.80, changePercent: 1.73, marketCap: '$180B' },
    { symbol: 'DE', company: 'John Deere', industry: 'metalworking', price: 420.10, change: 6.50, changePercent: 1.57, marketCap: '$125B' },
    { symbol: 'GE', company: 'GE Aerospace', industry: 'metalworking', price: 195.40, change: 2.30, changePercent: 1.19, marketCap: '$215B' },

    // Medical Devices
    { symbol: 'ISRG', company: 'Intuitive Surg.', industry: 'medical_devices', price: 420.80, change: 8.50, changePercent: 2.06, marketCap: '$155B' },
    { symbol: 'SYK', company: 'Stryker Corp', industry: 'medical_devices', price: 380.40, change: 5.20, changePercent: 1.38, marketCap: '$148B' },

    // Energy
    { symbol: 'NEE', company: 'NextEra Energy', industry: 'energy', price: 75.60, change: 1.80, changePercent: 2.44, marketCap: '$155B' },
    { symbol: 'FSLR', company: 'First Solar', industry: 'energy', price: 210.50, change: 6.40, changePercent: 3.14, marketCap: '$22B' },
];

// GDP Leaders (2026 Est.)
export const GDP_LEADERS: GDPData[] = [
    { country: 'USA', code: 'USA', gdp: 29.5, color: '#3b82f6' }, // Blue
    { country: 'China', code: 'CHN', gdp: 21.5, color: '#ef4444' }, // Red
    { country: 'Germany', code: 'DEU', gdp: 4.8, color: '#eab308' }, // Yellow
    { country: 'India', code: 'IND', gdp: 4.8, color: '#f97316' }, // Orange (Overtaking Japan)
    { country: 'Japan', code: 'JPN', gdp: 4.4, color: '#ffffff' }, // White
];

// Regional GDP Share (2026 Est.)
export const GDP_REGIONAL_SHARE: RegionalShareData[] = [
    { region: 'North America', share: 34, color: '#3b82f6' },
    { region: 'Asia', share: 36, color: '#ef4444' }, // Growing share
    { region: 'Europe', share: 18, color: '#eab308' }, // Slight decline
    { region: 'Other', share: 12, color: '#22c55e' },
];

// Daily Material Consumption (Global Est. 2026)
export const MATERIAL_CONSUMPTION: MaterialConsumptionData[] = [
    { material: 'Steel', dailyAmount: 5.4, unit: 'M tons', capacity: 6.5, color: '#60a5fa' },
    { material: 'Aluminum', dailyAmount: 210, unit: 'K tons', capacity: 320, color: '#9ca3af' },
    { material: 'Lithium', dailyAmount: 850, unit: 'tons', capacity: 1200, color: '#c084fc' }, // Replaced Fabric with Lithium
    { material: 'Copper', dailyAmount: 85, unit: 'K tons', capacity: 100, color: '#fbbf24' }, // Replaced Gold
    { material: 'Silicon', dailyAmount: 45, unit: 'tons', capacity: 60, color: '#94a3b8' }, // Replaced Silver
];

// Commodities & Key Materials (2026 Est.)
export const COMMODITIES: CommodityData[] = [
    { name: 'Gold', price: 5000.00, unit: 'USD/oz', change24h: 125.50, changePercent: 2.57, icon: '🥇' },
    { name: 'Silver', price: 65.00, unit: 'USD/oz', change24h: 1.45, changePercent: 2.28, icon: '🥈' },
    { name: 'Crude Oil (WTI)', price: 82.50, unit: 'USD/barrel', change24h: 0.85, changePercent: 1.04, icon: '🛢️' },
    { name: 'Natural Gas', price: 3.80, unit: 'USD/MMBtu', change24h: 0.15, changePercent: 4.10, icon: '⚡' },
    { name: 'Copper', price: 12000.00, unit: 'USD/ton', change24h: 210.00, changePercent: 1.78, icon: '🔶' },
    { name: 'Lithium Carb.', price: 28500.00, unit: 'USD/ton', change24h: 450.00, changePercent: 1.60, icon: '🔋' },
    { name: 'Silicon Wafer', price: 1250.00, unit: 'USD/wafer', change24h: 25.00, changePercent: 2.04, icon: '💾' },
    { name: 'AI Chip (H100 eq)', price: 26500.00, unit: 'USD/unit', change24h: -500.00, changePercent: -1.85, icon: '🧠' }, // Prices dropping as supply increases
];

// Future Industry Projections (Updated Baselines to 2026)
export const FUTURE_PROJECTIONS: FutureProjection[] = [
    // Electric Vehicles
    { category: 'Automotive', item: 'Electric Vehicles', current: 22000000, projected2030: 45000000, projected2040: 85000000, unit: 'units/year', icon: '🔋' },

    // Robots
    { category: 'Automation', item: 'Industrial Robots', current: 750000, projected2030: 1200000, projected2040: 2500000, unit: 'units/year', icon: '🤖' },
    { category: 'Automation', item: 'Collaborative Robots', current: 85000, projected2030: 250000, projected2040: 650000, unit: 'units/year', icon: '🦾' },
    { category: 'Automation', item: 'Service Robots', current: 320000, projected2030: 850000, projected2040: 2100000, unit: 'units/year', icon: '🦿' },
    { category: 'Automation', item: 'Warehouse Robots', current: 180000, projected2030: 480000, projected2040: 1200000, unit: 'units/year', icon: '📦' },

    // AI Infrastructure
    { category: 'AI Infrastructure', item: 'Data Centers', current: 10500, projected2030: 18000, projected2040: 32000, unit: 'facilities', icon: '🏢' },
    { category: 'AI Infrastructure', item: 'AI Accelerator Chips', current: 8500000, projected2030: 35000000, projected2040: 120000000, unit: 'units/year', icon: '🧠' },
    { category: 'AI Infrastructure', item: 'GPU Computing Power', current: 1200, projected2030: 5500, projected2040: 25000, unit: 'ExaFLOPS', icon: '💻' },

    // Renewable Energy
    { category: 'Energy', item: 'Solar Panels', current: 550000, projected2030: 950000, projected2040: 1850000, unit: 'MW/year', icon: '☀️' },
    { category: 'Energy', item: 'Wind Turbines', current: 145000, projected2030: 280000, projected2040: 520000, unit: 'MW/year', icon: '💨' },
];

// World Population by Continent (2026 Est.)
export const DEMOGRAPHICS: DemographicData[] = [
    { continent: 'Asia', population2024: 4820000000, projected2040: 5150000000, growthPercent: 5.50 },
    { continent: 'Africa', population2024: 1540000000, projected2040: 2250000000, growthPercent: 46.10 },
    { continent: 'Europe', population2024: 742000000, projected2040: 705000000, growthPercent: -4.98 },
    { continent: 'North America', population2024: 605000000, projected2040: 685000000, growthPercent: 13.22 },
    { continent: 'South America', population2024: 445000000, projected2040: 490000000, growthPercent: 10.11 },
    { continent: 'Oceania', population2024: 47000000, projected2040: 60000000, growthPercent: 27.65 },
];

// Currency Exchange Rates (vs USD) - 11 Key Manufacturing Countries (2026 Projections)
export const CURRENCY_RATES: CurrencyData[] = [
    { country: 'China', currency: 'Yuan', code: 'CNY', rateToUSD: 7.15, change24h: 0.05, flag: '🇨🇳' },
    { country: 'Bangladesh', currency: 'Taka', code: 'BDT', rateToUSD: 118.50, change24h: 0.35, flag: '🇧🇩' },
    { country: 'Vietnam', currency: 'Dong', code: 'VND', rateToUSD: 25100.00, change24h: -45.00, flag: '🇻🇳' },
    { country: 'India', currency: 'Rupee', code: 'INR', rateToUSD: 85.40, change24h: 0.22, flag: '🇮🇳' },
    { country: 'Mexico', currency: 'Peso', code: 'MXN', rateToUSD: 19.25, change24h: 0.15, flag: '🇲🇽' },
    { country: 'Turkey', currency: 'Lira', code: 'TRY', rateToUSD: 42.50, change24h: 0.85, flag: '🇹🇷' },
    { country: 'Portugal', currency: 'Euro', code: 'EUR', rateToUSD: 0.90, change24h: -0.002, flag: '🇵🇹' },
    { country: 'Poland', currency: 'Zloty', code: 'PLN', rateToUSD: 3.95, change24h: -0.01, flag: '🇵🇱' },
    { country: 'USA', currency: 'Dollar', code: 'USD', rateToUSD: 1.00, change24h: 0.00, flag: '🇺🇸' },
    { country: 'Japan', currency: 'Yen', code: 'JPY', rateToUSD: 138.50, change24h: -1.25, flag: '🇯🇵' },
    { country: 'Russia', currency: 'Ruble', code: 'RUB', rateToUSD: 98.50, change24h: 0.50, flag: '🇷🇺' },
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
