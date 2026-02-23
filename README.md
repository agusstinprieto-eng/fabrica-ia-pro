# 🏭 Manufactura IA Pro

Una plataforma avanzada de **Inteligencia Artificial aplicada a la Manufactura**, diseñada para optimizar procesos industriales, auditar métodos de producción y maximizar la eficiencia (OEE) utilizando el poder de Gemini 2.0 Flash.

## ✨ Características Principales

Esta aplicación proporciona un conjunto completo de herramientas para la industria 4.0:

### ⚙️ Ingeniería Inteligente (Process Auditing)
- **Análisis de Video**: Audita tiempos y movimientos subiendo videos de la línea de ensamble.
- **Aprobación de Métodos**: Evaluación automática de métodos de manufactura usando visión por computadora.
- **Detección de Cuellos de Botella**: Identifica pasos ineficientes de forma inteligente y propone mejoras.

### 📈 Monitoreo de Producción (OEE & Yield)
- **Cálculo de OEE**: Disponibilidad, Rendimiento y Calidad calculados en tiempo real.
- **Predicción de Fallas**: Análisis predictivo del Yield de Producción y alertas tempranas de pérdida de calidad.
- **Métricas Avanzadas**: First Pass Yield (FPY), Defectos por Millón de Oportunidades (DPMO).

### 🤖 Chatbot de Ingeniería (Gemini Assistant)
- **Respuestas Especializadas**: Asistente entrenado con metodologías Lean Manufacturing, Six Sigma y normativas industriales.
- **Identificación de Anomalías**: Detección inteligente de problemas mediante consultas en lenguaje natural.

### 🛡️ GodMode (Agus Pro)
- Acceso sin límites a análisis de video y reportes avanzados.
- Créditos infinitos para procesamiento de IA pesados.

## 🛠️ Stack Tecnológico

Construido con las mejores y más modernas tecnologías web:

### 🎯 Core Framework
- **⚡ Vite + React** - Framework frontend ultrarrápido y modular.
- **📘 TypeScript** - Tipado estricto para una experiencia de desarrollo robusta y segura.
- **🎨 Tailwind CSS** - Framework de utilidades para un diseño ágil y de alta calidad.

### 🧩 Interfaz y Experiencia (Cyber-Industrial)
- **Lucide React** - Biblioteca de íconos técnicos y consistentes.
- **Shadcn/UI** - Componentes accesibles, minimalistas y altamente personalizables.
- **Framer Motion** - Animaciones fluidas para interfaces reactivas.
- **Modo Oscuro Cyber-Industrial** - Diseño estético e inmersivo centrado en alto contraste para entornos industriales.

### 🧠 Inteligencia Artificial
- **Gemini 2.0 Flash SDK** - Integración directa con Google Gemini para análisis de texto y video (Multimodal).
- **Consensus Automation** - Algoritmos de decisión basados en inferencia de IA para aprobar/rechazar métodos.

## 🚀 Instalación y Uso

Sigue estos pasos para desplegar la plataforma localmente:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Crea un archivo .env en la raíz del proyecto y añade:
VITE_GEMINI_API_KEY=tu_api_key_de_gemini

# 3. Levantar el servidor de desarrollo
npm run dev

# 4. Construir para producción (opcional)
npm run build
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador para ver la plataforma.

## 📁 Estructura del Proyecto

```text
src/
├── components/          # Componentes de UI modulares
│   ├── modules/         # Módulos clave: EngineeringDashboard, YieldPredictor, etc.
│   ├── shared/          # Componentes reutilizables: CreditDisplay, Header, etc.
│   └── ui/              # Componentes base (shadcn)
├── contexts/            # Gestión de estado global (AppContext, Theme)
├── hooks/               # Custom hooks de React
├── services/            # Servicios de API (geminiService, consensusService, etc.)
├── types/               # Definiciones de tipos de TypeScript
└── lib/                 # Utilidades generales y constantes
```

## 🔐 Cuentas de Acceso (Demo & GodMode)

El sistema incluye una página de Login Premium con credenciales pre-configuradas:

- **Usuario Regular (Free):**
  - Usuario: `demo` / Contraseña: `demo123`
  - *Límite de créditos diarios.*
  
- **Administrador (GodMode):**
  - Usuario: `agus` / Contraseña: `[RESTRINGIDA]`
  - *Acceso ilimitado, créditos infinitos y funciones VIP de auditoría destrabadas.*

---

**Manufactura IA Pro** — Transformando datos crudos en inteligencia operativa estructurada y automatizada. 🚀🏭
