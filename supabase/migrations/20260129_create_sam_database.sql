-- Migration: create_sam_and_labor_tables
-- Created at: 2026-01-29

CREATE TABLE IF NOT EXISTS sam_operations (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    base_minutes DECIMAL NOT NULL,
    difficulty INTEGER NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS labor_rates (
    country TEXT PRIMARY KEY,
    hourly_rate DECIMAL NOT NULL,
    efficiency DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sam_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rates ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon/authenticated)
DROP POLICY IF EXISTS "Public read access for sam_operations" ON sam_operations;
CREATE POLICY "Public read access for sam_operations" ON sam_operations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access for labor_rates" ON labor_rates;
CREATE POLICY "Public read access for labor_rates" ON labor_rates FOR SELECT USING (true);

-- Seed Data
INSERT INTO sam_operations (code, description, base_minutes, difficulty, category) VALUES
('PKT_PATCH_SINGLE', 'Attach single patch pocket', 0.6, 1, 'pocket'),
('PKT_PATCH_DOUBLE', 'Attach double patch pocket', 1.1, 2, 'pocket'),
('PKT_SCOOP', 'Attach scoop pocket (front)', 0.8, 2, 'pocket'),
('PKT_WELT_SINGLE', 'Attach single welt pocket', 1.5, 3, 'pocket'),
('PKT_WELT_DOUBLE', 'Attach double welt pocket', 2.2, 3, 'pocket'),
('PKT_WATCH', 'Attach watch pocket (coin pocket)', 0.4, 1, 'pocket'),
('SEAM_SIDE_CLOSE', 'Close side seam (straight)', 0.4, 1, 'seam'),
('SEAM_INSEAM', 'Close inseam (pants)', 0.5, 1, 'seam'),
('SEAM_SHOULDER', 'Join shoulder seam', 0.3, 1, 'seam'),
('SEAM_FLAT_FELLED', 'Flat-felled seam (denim)', 0.9, 2, 'seam'),
('SEAM_FRENCH', 'French seam (delicate fabrics)', 1.0, 2, 'seam'),
('SEAM_OVERLOCK', 'Overlock edge finish', 0.2, 1, 'seam'),
('ZIP_CENTERED', 'Install centered zipper', 1.5, 2, 'closure'),
('ZIP_LAPPED', 'Install lapped zipper (fly)', 1.8, 3, 'closure'),
('ZIP_INVISIBLE', 'Install invisible zipper', 2.0, 3, 'closure'),
('BTN_ATTACH', 'Attach button (machine)', 0.1, 1, 'closure'),
('BTN_HOLE', 'Make buttonhole', 0.15, 1, 'closure'),
('SNAP_ATTACH', 'Attach snap fastener', 0.2, 1, 'closure'),
('HOOK_EYE', 'Attach hook and eye', 0.3, 2, 'closure'),
('HEM_BLIND', 'Blind hem stitch', 0.5, 2, 'hem'),
('HEM_TOPSTITCH', 'Topstitched hem', 0.4, 1, 'hem'),
('HEM_ROLLED', 'Rolled hem (delicate)', 0.7, 2, 'hem'),
('HEM_CUFF', 'Attach cuff (sleeve/pant)', 0.6, 2, 'hem'),
('HEM_FACING', 'Attach hem facing', 0.8, 2, 'hem'),
('DECO_TOPSTITCH_SINGLE', 'Single decorative topstitch', 0.3, 1, 'decorative'),
('DECO_TOPSTITCH_DOUBLE', 'Double decorative topstitch', 0.5, 1, 'decorative'),
('DECO_BARTACK', 'Bar tack reinforcement', 0.2, 1, 'decorative'),
('DECO_EMBROIDERY_SMALL', 'Small embroidery (logo)', 1.5, 2, 'decorative'),
('DECO_EMBROIDERY_LARGE', 'Large embroidery (back)', 3.0, 3, 'decorative'),
('WAIST_ATTACH', 'Attach waistband', 1.2, 2, 'other'),
('WAIST_ELASTIC', 'Insert elastic waistband', 0.8, 1, 'other'),
('COLLAR_ATTACH', 'Attach collar', 1.5, 2, 'other'),
('COLLAR_STAND', 'Attach collar with stand', 2.0, 3, 'other'),
('CUFF_ATTACH', 'Attach shirt cuff', 0.7, 2, 'other'),
('LOOP_BELT', 'Attach belt loop', 0.13, 1, 'other'),
('LABEL_SIZE', 'Attach size label', 0.2, 1, 'other'),
('LABEL_CARE', 'Attach care label', 0.15, 1, 'other'),
('LABEL_BRAND', 'Attach brand label/patch', 0.3, 1, 'other'),
('PLEAT_SINGLE', 'Form single pleat', 0.4, 2, 'other'),
('DART_SINGLE', 'Sew single dart', 0.3, 1, 'other'),
('GATHER_SECTION', 'Gather fabric section', 0.6, 2, 'other'),
('YOKE_ATTACH', 'Attach yoke', 0.9, 2, 'other'),
('SLEEVE_SET', 'Set sleeve', 1.0, 2, 'other'),
('SLEEVE_RAGLAN', 'Set raglan sleeve', 0.8, 2, 'other'),
('FINISH_PRESS', 'Final pressing', 0.5, 1, 'other'),
('FINISH_INSPECT', 'Quality inspection', 0.3, 1, 'other'),
('FINISH_FOLD', 'Fold and package', 0.2, 1, 'other'),
('FINISH_TAG', 'Attach hang tag', 0.1, 1, 'other')
ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    base_minutes = EXCLUDED.base_minutes,
    difficulty = EXCLUDED.difficulty,
    category = EXCLUDED.category;

INSERT INTO labor_rates (country, hourly_rate, efficiency) VALUES
('Mexico', 7.80, 0.75),
('Bangladesh', 2.30, 0.70),
('Vietnam', 3.20, 0.72),
('China', 5.50, 0.80),
('India', 2.80, 0.68),
('Honduras', 6.20, 0.73),
('USA', 18.50, 0.85)
ON CONFLICT (country) DO UPDATE SET
    hourly_rate = EXCLUDED.hourly_rate,
    efficiency = EXCLUDED.efficiency;
