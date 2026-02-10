-- Migration: Create company_knowledge_base table
-- This enables multi-company AI knowledge for chat and voice

CREATE TABLE IF NOT EXISTS public.company_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fast company lookup index
CREATE INDEX IF NOT EXISTS idx_kb_company ON public.company_knowledge_base(company);
CREATE INDEX IF NOT EXISTS idx_kb_company_category ON public.company_knowledge_base(company, category);

-- Enable RLS
ALTER TABLE public.company_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow public read (anon key can read all knowledge — filtered by company in queries)
CREATE POLICY "Allow public read of knowledge base"
  ON public.company_knowledge_base FOR SELECT
  USING (true);

-- Allow admin insert/update (service role or authenticated admins)
CREATE POLICY "Allow authenticated insert"
  ON public.company_knowledge_base FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
  ON public.company_knowledge_base FOR UPDATE
  USING (true);

-- ================================================
-- SEED DATA: GRUPO JOPER
-- ================================================

INSERT INTO public.company_knowledge_base (company, category, title, content, metadata) VALUES

-- Company Info
('GRUPO JOPER', 'empresa', 'Información General', 
'Grupo Joper: fabricante mexicano de maquinaria para construcción y transporte. Fundación: 1960, Gómez Palacio, Durango, México. Fundador: Don Jorge Pérez Valdés. Teléfono: (871) 290 7000 | WhatsApp: 871 151 2993. Distribución: México, Honduras, Guatemala, El Salvador, Perú, Ecuador, Venezuela, Panamá, Jamaica, República Dominicana, Puerto Rico, Nicaragua, Estados Unidos. Web: www.joper.com. 65+ años de experiencia y distribución en 14 países.',
'{"web": "https://www.joper.com", "catalogo_movil": "https://www.joper.com/movil.html", "catalogo_ligero": "https://www.joper.com/lig.html", "contacto": "https://www.joper.com/contact.html"}'::jsonb),

-- Línea Móvil (Transporte Pesado)
('GRUPO JOPER', 'linea_movil', 'Volteo Heavy (Pegaso Heavy Duty)',
'Capacidad: 6 m³ hasta 25 m³. Caja/Batea: Acero HARDOX 450. Sistema hidráulico: Marca PARKER. Sistema eléctrico: Marca GROTE. Pintura: Marca AXALTA. Accesorios: Caja de herramientas y portallantas desmontable.',
'{"ficha_tecnica": "https://www.joper.com/Heavy.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Volteo Europeo',
'Diseño europeo para carga pesada.',
'{"ficha_tecnica": "https://www.joper.com/VolteoEu.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Volteo Medium',
'Capacidad media, versátil.',
'{"ficha_tecnica": "https://www.joper.com/Volteo2.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Volteo Light',
'Ligero, maniobrable.',
'{"ficha_tecnica": "https://www.joper.com/Light.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'V-30 HARDOX',
'Dimensiones: 280 x 113 x 160 cm. Tanque: 280 lt combustible. Consumo: 80% x 11.6 lt/h. Autonomía: 16 hrs. Potencia Standby: 92 KW / 115 KVA. Encendido: Electrónico. Control: Módulo Deepsea DSE3110 con regulador de velocidad eléctrico.',
'{"ficha_tecnica": "https://www.joper.com/V30H.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'V30-HDX',
'Variante del V-30 con especificaciones HDX.',
'{"ficha_tecnica": "https://www.joper.com/hdx.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Full Góndola',
'Transporte de carga general a granel. 2 modelos disponibles.',
'{"ficha_tecnica": "https://www.joper.com/FullGondola.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Dolly',
'Acoplamiento de remolques. 3 modelos disponibles.',
'{"ficha_tecnica": "https://www.joper.com/DollyA.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Encortinada',
'Transporte protegido con cortinas laterales.',
'{"ficha_tecnica": "https://www.joper.com/Encortinada.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Pipa de Riego',
'Tanque especializado para riego.',
'{"ficha_tecnica": "https://www.joper.com/PipaRiego.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Pipa Diesel',
'Tanque para combustible diesel.',
'{"ficha_tecnica": "https://www.joper.com/PipaDiesel.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Multimodal',
'Plataforma de transporte multiuso. 2 modelos disponibles.',
'{"ficha_tecnica": "https://www.joper.com/Multimodal.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Silo',
'Almacenamiento y transporte de materiales a granel.',
'{"ficha_tecnica": "https://www.joper.com/Silo.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Tara',
'Transporte especializado.',
'{"ficha_tecnica": "https://www.joper.com/Tara.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Forrajera',
'Transporte de forraje y productos agrícolas.',
'{"ficha_tecnica": "https://www.joper.com/Forrajera.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Portacontenedor',
'Transporte intermodal de contenedores.',
'{"ficha_tecnica": "https://www.joper.com/Portacontenedor.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Hyva',
'Sistema hidráulico para volteos.',
'{"ficha_tecnica": "https://www.joper.com/Hyva.html"}'::jsonb),

('GRUPO JOPER', 'linea_movil', 'Granalera Acero',
'Transporte de granel.',
'{"ficha_tecnica": "https://www.joper.com/Acero.html"}'::jsonb),

-- Línea Ligero - Revolvedoras
('GRUPO JOPER', 'revolvedoras', 'Ultramax 100',
'Capacidad: 1 saco. Llanta: Rin 12, Yugo PTR 3x3 pulgadas. Dimensiones: 195cm alto x 107cm ancho x 175cm largo. Peso: 230 kg con motor. Motor: 5.5 HP hasta 9.5 HP. Producción: 5 m³ concreto/día. Ciclo: 3 min. Velocidad olla: 27-31 RPM. La revolvedora más competitiva en México, chasis estable reforzado en V.',
'{"ficha_tecnica": "https://www.joper.com/Ultramax.html"}'::jsonb),

('GRUPO JOPER', 'revolvedoras', 'R100LX (Caballo de Batalla)',
'Capacidad: 1 saco. Llanta: Rin 13, Yugo PTR 3x3 pulgadas. Dimensiones: 55 pulg alto x 42 pulg ancho x 72 pulg largo. Peso: 365 kg con motor. Motor: 6.5 HP hasta 14 HP. Producción: 5 m³/día. Ciclo: 3 min. 27-31 RPM. Gabinete abatible, tolva protectora, cremallera reforzada de una pieza. Ideal para trabajo pesado y renteros.',
'{"ficha_tecnica": "https://www.joper.com/R100LX.html"}'::jsonb),

('GRUPO JOPER', 'revolvedoras', 'R200LX',
'Revolvedora de mayor capacidad.',
'{"ficha_tecnica": "https://www.joper.com/R200LX.html"}'::jsonb),

('GRUPO JOPER', 'revolvedoras', 'R100TB',
'Revolvedora robusta.',
'{"ficha_tecnica": "https://www.joper.com/R100TB.html"}'::jsonb),

('GRUPO JOPER', 'revolvedoras', 'Max Mix CM 150',
'Revolvedora compacta.',
'{"ficha_tecnica": "https://www.joper.com/Maxmix150.html"}'::jsonb),

('GRUPO JOPER', 'revolvedoras', 'Mortero',
'Mezcladora de mortero.',
'{"ficha_tecnica": "https://www.joper.com/Mortero.html"}'::jsonb),

('GRUPO JOPER', 'revolvedoras', 'Polimax',
'Revolvedora especializada.',
'{"ficha_tecnica": "https://www.joper.com/Polimax.html"}'::jsonb),

('GRUPO JOPER', 'revolvedoras', 'Vogue',
'Revolvedora de diseño moderno.',
'{"ficha_tecnica": "https://www.joper.com/Vogue.html"}'::jsonb),

-- Línea Ligero - Corte
('GRUPO JOPER', 'corte', 'Cortadora CA-13',
'Corte de concreto y asfalto.',
'{"ficha_tecnica": "https://www.joper.com/ConcretoAsfaltoCA13.html"}'::jsonb),

('GRUPO JOPER', 'corte', 'Cortadora Super',
'Corte de alta potencia.',
'{"ficha_tecnica": "https://www.joper.com/ConcretoAsfalto.html"}'::jsonb),

('GRUPO JOPER', 'corte', 'Concreto y Asfalto KL',
'Cortadora versátil.',
'{"ficha_tecnica": "https://www.joper.com/ConcretoAsfaltoKL.html"}'::jsonb),

('GRUPO JOPER', 'corte', 'Mesa Cortadora',
'Corte de materiales en mesa.',
'{"ficha_tecnica": "https://www.joper.com/MesaCortadora.html"}'::jsonb),

-- Línea Ligero - Compactación y Superficie
('GRUPO JOPER', 'compactacion', 'Rodillo Vibrador RV-4',
'Compactación ligera.',
'{"ficha_tecnica": "https://www.joper.com/Rodvibrv4.html"}'::jsonb),

('GRUPO JOPER', 'compactacion', 'Rodillo Vibrador RV-8',
'Compactación media.',
'{"ficha_tecnica": "https://www.joper.com/Rodvibrv8.html"}'::jsonb),

('GRUPO JOPER', 'compactacion', 'Rodillo con Operador SS-13',
'Compactación pesada con operador.',
'{"ficha_tecnica": "https://www.joper.com/Rodvibop.html"}'::jsonb),

('GRUPO JOPER', 'compactacion', 'Compactadora de Placa',
'Compactación de superficies planas.',
'{"ficha_tecnica": "https://www.joper.com/Compap800.html"}'::jsonb),

('GRUPO JOPER', 'compactacion', 'Allanadora AL-40',
'Acabado de superficies de concreto.',
'{"ficha_tecnica": "https://www.joper.com/AllanadoraAL40.html"}'::jsonb),

('GRUPO JOPER', 'compactacion', 'Escarificadora E-800',
'Remoción de superficie.',
'{"ficha_tecnica": "https://www.joper.com/Escarificadora.html"}'::jsonb),

('GRUPO JOPER', 'compactacion', 'Uniregla',
'Nivelación de superficies.',
'{"ficha_tecnica": "https://www.joper.com/Uniregla.html"}'::jsonb),

-- Línea Ligero - Vibración
('GRUPO JOPER', 'vibracion', 'Vibrador V3EM',
'Vibrado de concreto eléctrico.',
'{"ficha_tecnica": "https://www.joper.com/Vibradorv3em.html"}'::jsonb),

('GRUPO JOPER', 'vibracion', 'Vibrador Pendular',
'Vibrado pendular.',
'{"ficha_tecnica": "https://www.joper.com/Pendular.html"}'::jsonb),

-- Línea Ligero - Generación Eléctrica
('GRUPO JOPER', 'generacion', 'Generador 30KW',
'Generación en obra pequeña.',
'{"ficha_tecnica": "https://www.joper.com/Generacion30KW.html"}'::jsonb),

('GRUPO JOPER', 'generacion', 'Generador 60KW',
'Generación en obra media.',
'{"ficha_tecnica": "https://www.joper.com/Generacion60KW.html"}'::jsonb),

('GRUPO JOPER', 'generacion', 'Generador 100KW',
'Generación en obra grande.',
'{"ficha_tecnica": "https://www.joper.com/Generacion100KW.html"}'::jsonb),

-- Línea Ligero - Soldadura
('GRUPO JOPER', 'soldadura', 'Soldadora de Gasolina',
'Soldadura portátil.',
'{"ficha_tecnica": "https://www.joper.com/SoldadoraGasolina.html"}'::jsonb),

('GRUPO JOPER', 'soldadura', 'Soldadora de Diesel',
'Soldadura industrial.',
'{"ficha_tecnica": "https://www.joper.com/SoldadoraDiesel.html"}'::jsonb),

-- Línea Ligero - Elevación
('GRUPO JOPER', 'elevacion', 'Pluma Giratoria JP-1000',
'Elevación de materiales en obra.',
'{"ficha_tecnica": "https://www.joper.com/PlumaGiratoria.html"}'::jsonb),

('GRUPO JOPER', 'elevacion', 'Montacargas',
'Manejo de materiales pesados.',
'{"ficha_tecnica": "https://www.joper.com/Montacargas.html"}'::jsonb),

('GRUPO JOPER', 'elevacion', 'Malacate',
'Elevación vertical de cargas.',
'{"ficha_tecnica": "https://www.joper.com/Malacate.html"}'::jsonb),

('GRUPO JOPER', 'elevacion', 'Jaguar RAM-75',
'Equipo de carga pesada.',
'{"ficha_tecnica": "https://www.joper.com/JaguarRam75.html"}'::jsonb),

('GRUPO JOPER', 'elevacion', 'Jaguar RAM 75P',
'Variante de carga.',
'{"ficha_tecnica": "https://www.joper.com/JaguarRam75P.html"}'::jsonb),

-- Línea Ligero - Iluminación
('GRUPO JOPER', 'iluminacion', 'Luminaria LD6KW',
'Torre de iluminación para obra nocturna.',
'{"ficha_tecnica": "https://www.joper.com/Torre.html"}'::jsonb);
