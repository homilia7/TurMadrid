---
name: estilo-ide
description: >-
  Guía de diseño, arquitectura visual y componentes para crear interfaces web con estética de Software Desktop,
  Sistema Operativo de Agentes (AgentOS) e IDE profesional (tipo VS Code / JetBrains / Arqaistudio / urlLink).
  Incluye barra de menús, tarjetas de alta densidad, modales compactos sin scrollbar, botones de copiado rápido interactivos,
  soporte bimodal Dark/Light de alto contraste y barra de estado inferior inmóvil.
---

# Skill: Sistema de Diseño Estilo IDE & Software Desktop Profesional (AgentOS & Desktop UI)

Esta Skill establece las directrices de interfaz, maquetación, paleta de colores bimodal de alto contraste (Dark & Light Mode), componentes compactos y estándares de experiencia de usuario para construir o transformar aplicaciones web en herramientas con apariencia de **Software de Escritorio Profesional (Desktop IDE / AgentOS)**, inspirado en **ARQAISTUDIO (AgentOS)** y **urlLink Hub**.

---

## 1. Principios Fundamentales del Diseño Estilo IDE

1. **Alta Densidad y Cero Desperdicio de Espacio:** Aprovechamiento milimétrico del espacio visual, tipografías compactas (`10.5px` a `13.5px`), márgenes ajustados (`6px` a `12px`), y modales directos sin padding inflado.
2. **Arquitectura Bimodal Impecable (Dark & Light Mode de Alto Contraste):**
   - **Dark Mode:** Fondos oscuros profundos (`#07090c` / `#090d13` / `#0e1117`), superficies secundarias en `#161b22` / `bg-zinc-900`, bordes translúcidos (`border-zinc-800` / `rgba(255,255,255,0.1)`).
   - **Light Mode:** Fondos limpios (`bg-zinc-100` / `#f6f8fa`), tarjetas blancas puras (`bg-white`), barras y cabeceras en `bg-zinc-50`, bordes nítidos (`border-zinc-200` / `#d0d7de`) y textos oscuros de alto contraste (`text-zinc-900` / `text-zinc-700`).
   - **Regla Antiparasitaria de Temas:** PROHIBIDO usar fondos oscuros fijos (como `bg-zinc-950` o `bg-black`) sin su contraparte clara (`bg-white` o `bg-zinc-50`). Nunca colocar texto oscuro sobre fondos oscuros ni texto claro sobre fondos blancos.
3. **Cero Scrollbars Innecesarias:** Ningún componente interno (como notas, etiquetas, selectores o formularios) debe generar barras de desplazamiento horizontales o verticales forzadas.
4. **Acceso Rápido y Micro-Interacciones:** Botones de copiado directo con retroalimentación visual inmediata (`<span>✅</span> ¡Copiado!`), micro-badges de estado tipo píldora y transiciones ágiles (`150ms`).
5. **Tipografía Monospaciada para Telemetría, APIs y Claves:** Uso de fuentes mono (`JetBrains Mono`, `Fira Code`, `font-mono`) para tokens, usuarios, IDs, endpoints REST, cURL, passwords enmascaradas (`••••••••`) y métricas del sistema.

---

## 2. Paleta Bimodal de Clases Tailwind CSS & Variables

### A) Equivalencias Clave Dark / Light

| Elemento UI | Modo Claro (Light) | Modo Oscuro (Dark) |
| :--- | :--- | :--- |
| **Fondo Principal App** | `bg-zinc-100` / `bg-[#f8fafc]` | `dark:bg-[#07090c]` / `dark:bg-[#090d13]` |
| **Tarjetas & Modales** | `bg-white` | `dark:bg-zinc-900` / `dark:bg-[#0e1117]` |
| **Cabeceras & Barras** | `bg-zinc-50` / `bg-zinc-100/90` | `dark:bg-zinc-950` / `dark:bg-[#16191f]` |
| **Bordes Estándar** | `border-zinc-200` / `border-zinc-300` | `dark:border-zinc-800` / `dark:border-zinc-700` |
| **Texto Títulos** | `text-zinc-900 font-bold` | `dark:text-white font-bold` |
| **Texto Secundario** | `text-zinc-700` | `dark:text-zinc-300` |
| **Texto Muted / Guías** | `text-zinc-500` / `text-zinc-600` | `dark:text-zinc-400` / `dark:text-zinc-500` |
| **Inputs & Textareas** | `bg-zinc-50 border-zinc-200 text-zinc-900` | `dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100` |
| **Cajas de Código Mono** | `bg-white border-zinc-200 text-indigo-950` | `dark:bg-zinc-900 dark:border-zinc-800 dark:text-indigo-200` |

### B) Sistema de Badges y Píldoras Semánticas

```tsx
// 1. Estado Activo / Éxito (Esmeralda)
"bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500/40"

// 2. Credenciales / API Keys / Alertas (Ámbar)
"bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50"

// 3. Bloqueo / Seguridad / Error (Rosa / Rojo)
"bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/80"

// 4. Agentes / IA / Procesos (Índigo / Violeta)
"bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/90 dark:text-indigo-300 dark:border-indigo-500/50"

// 5. Neutro / Sistema / ID de Proyecto (Zinc)
"bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
```

---

## 3. Catálogo de Componentes Estilo IDE & Desktop

### A) Ventana Modal de Onboarding & Credenciales API (Full Bimodal)
Diseño de alto impacto para exponer credenciales, Base URLs y prompts a agentes de IA externos:

```tsx
<div className="fixed inset-0 z-[9999] bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-xs">
    
    {/* Cabecera Desktop */}
    <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-700 dark:text-indigo-400 shrink-0 shadow-2xs">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Instrucciones & API Key para Agentes IA
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300">
              v2.0 Full Autonomous
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Copia credenciales y prompts con 1 solo clic.
          </p>
        </div>
      </div>
      <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
        <X className="w-4 h-4" />
      </button>
    </div>

    {/* Barra de Credenciales Rápidas de Alto Contraste */}
    <div className="bg-indigo-50/80 dark:bg-indigo-950/50 border-b border-indigo-100 dark:border-indigo-900/60 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-1.5">
          <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Base URL:</span>
          <code className="font-mono text-[11px] bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-900/80 font-bold text-indigo-950 dark:text-indigo-200 shadow-2xs">
            https://arqaistudio.pages.dev/api
          </code>
        </div>
        <div className="flex items-center space-x-1.5">
          <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">API Key:</span>
          <code className="font-mono text-[11px] bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md border border-amber-300 dark:border-amber-500/40 font-bold text-amber-800 dark:text-amber-300 shadow-2xs">
            arqai_sec_1234_main
          </code>
        </div>
        <button className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs">
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar (Base URL + Key)</span>
        </button>
      </div>

      {/* Botón Mágico 1-Clic */}
      <button className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black shadow-md shadow-emerald-900/20 transition-all flex items-center space-x-2 cursor-pointer uppercase tracking-wider">
        <Sparkles className="w-4 h-4 text-emerald-100" />
        <span>⚡ Copiar Todo en 1 Clic</span>
      </button>
    </div>

    {/* Cuerpo con Pestañas y Código */}
    <div className="p-4 sm:p-5 space-y-3 overflow-y-auto bg-white dark:bg-zinc-900">
      <pre className="bg-zinc-900 dark:bg-zinc-950 p-4 rounded-xl text-[11px] font-mono text-zinc-100 border border-zinc-800 whitespace-pre-wrap leading-relaxed max-h-80 shadow-inner select-all">
        {`Eres el Agente Autónomo subordinado a ARQAISTUDIO...`}
      </pre>
    </div>

    {/* Footer */}
    <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
        Seguridad reforzada con autenticación por <code>x-api-key</code>
      </span>
      <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg border border-zinc-300 dark:bg-zinc-800 dark:text-white transition-colors cursor-pointer">
        Cerrar
      </button>
    </div>
  </div>
</div>
```

---

### B) Ficha de Memoria de Contexto Técnico (2 Columnas Sin Scrollbar)
Ficha técnica compacta para delimitar qué puede y qué no puede hacer una IA en una tarea específica:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-4 bg-white dark:bg-zinc-900">
  {/* Requerimientos */}
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
      <span className="flex items-center space-x-1.5">
        <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Requerimientos del Sistema:</span>
      </span>
      <span className="text-[9px] text-zinc-500 font-mono">(3)</span>
    </label>
    <div className="flex space-x-1.5">
      <input
        type="text"
        placeholder="Ej: Contraste WCAG AA, responsivo..."
        className="flex-1 px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-2xs"
      />
      <button className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-0.5">
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-[10px] text-zinc-800 dark:text-zinc-200">
        <span>Contraste WCAG AA</span>
      </span>
    </div>
  </div>

  {/* Archivos Afectados */}
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
      <span className="flex items-center space-x-1.5">
        <FileCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>Archivos Afectados:</span>
      </span>
      <span className="text-[9px] text-zinc-500 font-mono">(1)</span>
    </label>
    <div className="flex space-x-1.5">
      <input
        type="text"
        placeholder="src/components/Navbar.tsx..."
        className="flex-1 px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 font-mono shadow-2xs"
      />
      <button className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</div>
```

---

### C) Barra de Telemetría Inferior Inmóvil (IDE Status Bar)
Barra fija al fondo de la pantalla (`bottom-0`, `h-7`), inspirada en la status bar de VS Code / JetBrains:

```tsx
<footer className="fixed bottom-0 left-0 right-0 h-7 bg-white dark:bg-[#07090c] border-t border-zinc-200 dark:border-zinc-800 px-3 flex items-center justify-between text-[10px] text-zinc-600 dark:text-zinc-400 select-none z-40">
  {/* Lado Izquierdo: Estado del Motor & Proyecto */}
  <div className="flex items-center space-x-3">
    <div className="flex items-center space-x-1.5 font-bold text-zinc-900 dark:text-zinc-200">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>ARQAI AgentOS</span>
    </div>
    <span className="text-zinc-300 dark:text-zinc-700">|</span>
    <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">
      Proyecto: {activeProject.name}
    </span>
  </div>

  {/* Lado Derecho: Telemetría, Memoria y Conectividad */}
  <div className="flex items-center space-x-3 font-mono">
    <span className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400">
      <Database className="w-3 h-3" />
      <span>Cloudflare D1: Conectado</span>
    </span>
    <span className="text-zinc-300 dark:text-zinc-700">|</span>
    <span className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400">
      <Bot className="w-3 h-3" />
      <span>Gatekeeper: Activo</span>
    </span>
    <span className="text-zinc-300 dark:text-zinc-700">|</span>
    <span className="text-zinc-500 font-bold">GMT-6 CR</span>
  </div>
</footer>
```

---

## 4. Helper Universal de Copiado con Feedback Interactivo

```typescript
export const copyToClipboardWithFeedback = (
  text: string,
  setFeedbackState: (val: boolean) => void,
  duration = 2000
) => {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    setFeedbackState(true);
    setTimeout(() => {
      setFeedbackState(false);
    }, duration);
  });
};
```

---

## 5. Checklist Obligatorio para Todo Componente Estilo IDE

* [ ] **Contraste Bimodal Estricto:** Comprobar siempre en **Tema Claro** y **Tema Oscuro**. Ningún contenedor debe tener fondos oscuros residuales en modo claro.
* [ ] **Cajas de Código Legibles:** Usar `bg-white` en modo claro y `bg-zinc-900` en modo oscuro con texto de alto contraste.
* [ ] **Inputs y Formularios Armonizados:** Fondos claros `bg-zinc-50`, bordes limpios `border-zinc-200` y textos `text-zinc-900`.
* [ ] **Botones de Copiado Rápido:** Incluir siempre icono de confirmación `Check` y cambio transitorio a estado de éxito.
* [ ] **Ancho y Altura de Modales:** `max-w-3xl` o `max-w-4xl`, `max-h-[88vh]`, con `overflow-y-auto` y `overflow-x-hidden`.
* [ ] **Tipografía Monospaciada:** Aplicada en tokens, claves API, IDs, endpoints y fechas.
