import { SAMEntry, LaborRate } from '../types/quoter';

// Standard Allowed Minutes Database (GSD-based)
export const SAM_DATABASE: SAMEntry[] = [
    // POCKETS
    { code: 'PKT_PATCH_SINGLE', description: 'Attach single patch pocket', baseMinutes: 0.6, difficulty: 1, category: 'pocket' },
    { code: 'PKT_PATCH_DOUBLE', description: 'Attach double patch pocket', baseMinutes: 1.1, difficulty: 2, category: 'pocket' },
    { code: 'PKT_SCOOP', description: 'Attach scoop pocket (front)', baseMinutes: 0.8, difficulty: 2, category: 'pocket' },
    { code: 'PKT_WELT_SINGLE', description: 'Attach single welt pocket', baseMinutes: 1.5, difficulty: 3, category: 'pocket' },
    { code: 'PKT_WELT_DOUBLE', description: 'Attach double welt pocket', baseMinutes: 2.2, difficulty: 3, category: 'pocket' },
    { code: 'PKT_WATCH', description: 'Attach watch pocket (coin pocket)', baseMinutes: 0.4, difficulty: 1, category: 'pocket' },

    // SEAMS
    { code: 'SEAM_SIDE_CLOSE', description: 'Close side seam (straight)', baseMinutes: 0.4, difficulty: 1, category: 'seam' },
    { code: 'SEAM_INSEAM', description: 'Close inseam (pants)', baseMinutes: 0.5, difficulty: 1, category: 'seam' },
    { code: 'SEAM_SHOULDER', description: 'Join shoulder seam', baseMinutes: 0.3, difficulty: 1, category: 'seam' },
    { code: 'SEAM_FLAT_FELLED', description: 'Flat-felled seam (denim)', baseMinutes: 0.9, difficulty: 2, category: 'seam' },
    { code: 'SEAM_FRENCH', description: 'French seam (delicate fabrics)', baseMinutes: 1.0, difficulty: 2, category: 'seam' },
    { code: 'SEAM_OVERLOCK', description: 'Overlock edge finish', baseMinutes: 0.2, difficulty: 1, category: 'seam' },

    // CLOSURES
    { code: 'ZIP_CENTERED', description: 'Install centered zipper', baseMinutes: 1.5, difficulty: 2, category: 'closure' },
    { code: 'ZIP_LAPPED', description: 'Install lapped zipper (fly)', baseMinutes: 1.8, difficulty: 3, category: 'closure' },
    { code: 'ZIP_INVISIBLE', description: 'Install invisible zipper', baseMinutes: 2.0, difficulty: 3, category: 'closure' },
    { code: 'BTN_ATTACH', description: 'Attach button (machine)', baseMinutes: 0.1, difficulty: 1, category: 'closure' },
    { code: 'BTN_HOLE', description: 'Make buttonhole', baseMinutes: 0.15, difficulty: 1, category: 'closure' },
    { code: 'SNAP_ATTACH', description: 'Attach snap fastener', baseMinutes: 0.2, difficulty: 1, category: 'closure' },
    { code: 'HOOK_EYE', description: 'Attach hook and eye', baseMinutes: 0.3, difficulty: 2, category: 'closure' },

    // HEMS
    { code: 'HEM_BLIND', description: 'Blind hem stitch', baseMinutes: 0.5, difficulty: 2, category: 'hem' },
    { code: 'HEM_TOPSTITCH', description: 'Topstitched hem', baseMinutes: 0.4, difficulty: 1, category: 'hem' },
    { code: 'HEM_ROLLED', description: 'Rolled hem (delicate)', baseMinutes: 0.7, difficulty: 2, category: 'hem' },
    { code: 'HEM_CUFF', description: 'Attach cuff (sleeve/pant)', baseMinutes: 0.6, difficulty: 2, category: 'hem' },
    { code: 'HEM_FACING', description: 'Attach hem facing', baseMinutes: 0.8, difficulty: 2, category: 'hem' },

    // DECORATIVE
    { code: 'DECO_TOPSTITCH_SINGLE', description: 'Single decorative topstitch', baseMinutes: 0.3, difficulty: 1, category: 'decorative' },
    { code: 'DECO_TOPSTITCH_DOUBLE', description: 'Double decorative topstitch', baseMinutes: 0.5, difficulty: 1, category: 'decorative' },
    { code: 'DECO_BARTACK', description: 'Bar tack reinforcement', baseMinutes: 0.2, difficulty: 1, category: 'decorative' },
    { code: 'DECO_EMBROIDERY_SMALL', description: 'Small embroidery (logo)', baseMinutes: 1.5, difficulty: 2, category: 'decorative' },
    { code: 'DECO_EMBROIDERY_LARGE', description: 'Large embroidery (back)', baseMinutes: 3.0, difficulty: 3, category: 'decorative' },

    // WAISTBANDS & COLLARS
    { code: 'WAIST_ATTACH', description: 'Attach waistband', baseMinutes: 1.2, difficulty: 2, category: 'other' },
    { code: 'WAIST_ELASTIC', description: 'Insert elastic waistband', baseMinutes: 0.8, difficulty: 1, category: 'other' },
    { code: 'COLLAR_ATTACH', description: 'Attach collar', baseMinutes: 1.5, difficulty: 2, category: 'other' },
    { code: 'COLLAR_STAND', description: 'Attach collar with stand', baseMinutes: 2.0, difficulty: 3, category: 'other' },
    { code: 'CUFF_ATTACH', description: 'Attach shirt cuff', baseMinutes: 0.7, difficulty: 2, category: 'other' },

    // BELT LOOPS & LABELS
    { code: 'LOOP_BELT', description: 'Attach belt loop', baseMinutes: 0.13, difficulty: 1, category: 'other' },
    { code: 'LABEL_SIZE', description: 'Attach size label', baseMinutes: 0.2, difficulty: 1, category: 'other' },
    { code: 'LABEL_CARE', description: 'Attach care label', baseMinutes: 0.15, difficulty: 1, category: 'other' },
    { code: 'LABEL_BRAND', description: 'Attach brand label/patch', baseMinutes: 0.3, difficulty: 1, category: 'other' },

    // SPECIAL OPERATIONS
    { code: 'PLEAT_SINGLE', description: 'Form single pleat', baseMinutes: 0.4, difficulty: 2, category: 'other' },
    { code: 'DART_SINGLE', description: 'Sew single dart', baseMinutes: 0.3, difficulty: 1, category: 'other' },
    { code: 'GATHER_SECTION', description: 'Gather fabric section', baseMinutes: 0.6, difficulty: 2, category: 'other' },
    { code: 'YOKE_ATTACH', description: 'Attach yoke', baseMinutes: 0.9, difficulty: 2, category: 'other' },
    { code: 'SLEEVE_SET', description: 'Set sleeve', baseMinutes: 1.0, difficulty: 2, category: 'other' },
    { code: 'SLEEVE_RAGLAN', description: 'Set raglan sleeve', baseMinutes: 0.8, difficulty: 2, category: 'other' },

    // FINISHING
    { code: 'FINISH_PRESS', description: 'Final pressing', baseMinutes: 0.5, difficulty: 1, category: 'other' },
    { code: 'FINISH_INSPECT', description: 'Quality inspection', baseMinutes: 0.3, difficulty: 1, category: 'other' },
    { code: 'FINISH_FOLD', description: 'Fold and package', baseMinutes: 0.2, difficulty: 1, category: 'other' },
    { code: 'FINISH_TAG', description: 'Attach hang tag', baseMinutes: 0.1, difficulty: 1, category: 'other' }
];

// Global Labor Rates (2026 estimates)
export const LABOR_RATES: LaborRate[] = [
    { country: 'Mexico', hourlyRate: 7.80, efficiency: 0.75 },
    { country: 'Bangladesh', hourlyRate: 2.30, efficiency: 0.70 },
    { country: 'Vietnam', hourlyRate: 3.20, efficiency: 0.72 },
    { country: 'China', hourlyRate: 5.50, efficiency: 0.80 },
    { country: 'India', hourlyRate: 2.80, efficiency: 0.68 },
    { country: 'Honduras', hourlyRate: 6.20, efficiency: 0.73 },
    { country: 'USA', hourlyRate: 18.50, efficiency: 0.85 }
];

export const getSAMByCode = (code: string): SAMEntry | undefined => {
    return SAM_DATABASE.find(entry => entry.code === code);
};

export const getSAMsByCategory = (category: string): SAMEntry[] => {
    return SAM_DATABASE.filter(entry => entry.category === category);
};

export const getLaborRate = (country: string): LaborRate | undefined => {
    return LABOR_RATES.find(rate => rate.country === country);
};

export const calculateOperationCost = (
    samEntry: SAMEntry,
    quantity: number,
    laborRate: LaborRate
): number => {
    const totalMinutes = samEntry.baseMinutes * quantity * samEntry.difficulty;
    const hourlyAdjusted = laborRate.hourlyRate / laborRate.efficiency;
    return (totalMinutes / 60) * hourlyAdjusted;
};
