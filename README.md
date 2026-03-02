# Monica CRM — AI Office (Dashboard de Observabilidad Agéntica)

Interfaz de observabilidad operativa en tiempo real representada como una oficina 2D Pixel Art. Permite monitorear el estado, carga de trabajo y actividad de los agentes de IA conversacionales conectados a canales de mensajería (WhatsApp, Instagram, Web) sin necesidad de acceso a bases de datos crudas o logs de backend. El sistema democratiza el monitoreo técnico para stakeholders operativos y directivos.

![Monica CRM AI Office](https://img.shields.io/badge/React-Canvas_2D-blue) ![Supabase](https://img.shields.io/badge/Supabase-Edge_Functions-green) ![Vite](https://img.shields.io/badge/Vite-v7-purple)

## Problema que resuelve

Los agentes de IA a menudo operan como una "caja negra". Sin esta herramienta, determinar si un agente está saturado, inactivo, o procesando información requería inspeccionar tablas crudas en Supabase (`wp_mensajes`, `wp_conversaciones`, `wp_agentes`). Esto era inaccesible para la dirección y extremadamente lento para los operadores en vivo.

## Arquitectura implementada

```
Supabase PostgreSQL
┌────────────────────────────────────────────────────────┐
│  wp_agentes          wp_conversaciones  wp_mensajes    │
│  ├─ id               ├─ agente_id       ├─ conversacion│
│  ├─ nombre           ├─ estado          ├─ uso_herram. │
│  ├─ estado_actual    ├─ canal           └─ timestamp   │
│  └─ ultima_actividad └─ mensajes_hora                  │
└────────────────────────────────────────────────────────┘
         │
         ▼
Edge Function: agent-office-status (Deno)
         │
         ├─► Agrega: conversaciones activas por agente
         ├─► Calcula: msgs/hora y KPIs globales
         ├─► Determina: estado computado enriquecido
         │   ├─ msgs/h > límite → "overloaded"
         │   ├─ uso_herramientas activo → "responding", "scheduling"
         │   └─ sin actividad > 5min → "idle"
         │
         └─► Retorna: { agents: [...], kpis: {...} }
 
React App (polling 5s)
┌──────────────────────────────────────────────────────────┐
│  useAgentStates.js                                        │
│  ├─ fetch() → Edge Function cada 5s                       │
│  └─ Fallback mock si API no responde                      │
│                                                           │
│  PixelOffice.jsx (HTML5 Canvas 1100×700)                  │
│  ├─ Salas: Meeting, Private Office, Kitchen, Lounge       │
│  ├─ Avatares: sprites animados y posicionamiento dinámico │
│  ├─ Speech bubbles: acción actual del agente              │
│  ├─ Heat indicators: aura pulsante por carga de trabajo   │
│  └─ KPI overlay: msgs/h, convos abiertas, agentes activos │
│                                                           │
│  ActivityFeed.jsx                                         │
│  └─ Log de eventos en tiempo real (persistente en client) │
│                                                           │
│  AgentDetail.jsx                                          │
│  └─ Modal focus: métricas completas e historial por agente│
└──────────────────────────────────────────────────────────┘
```

### Decisión arquitectónica — Polling vs. WebSocket

Se eligió **polling de 5s** (en lugar de Supabase Realtime/WebSockets) para evitar mantener conexiones activas permanentemente en un dashboard diseñado para correr desatendido en pantallas secundarias 24/7. Los estados macro de los agentes cambian en escala de segundos o minutos, por lo que 5s es un intervalo técnicamente justificado que balancea inmediatez y costo de infraestructura.

## Features clave y Estado Actual

- **Auto-discovery de agentes**: Nuevos agentes añadidos a la BD se muestran automáticamente en el canvas en la zona correspondiente (activos en "Work Area", inactivos en "Sala OFF").
- **Mapeo de estados preciso**: La Edge Function deduce el estado real (`working`, `waiting`, `responding`, `scheduling`) basado en metadatos de los últimos mensajes y herramientas usadas.
- **Heat indicators**: Aura direccional (verde → amarillo → naranja → rojo) basada en el volumen de conversaciones activas por agente para detectar saturación de un vistazo.
- **Performance extrema**: Motor de renderizado Pixel Art custom en Canvas 2D (`< 25KB`). Ultra ligero, no degrada el performance del navegador incluso tras días de ejecución.
- **Audio de notificaciones retro**: Web Audio API genera tonos 8-bit sintetizados dinámicamente al cambiar de estado (no requiere cargar MP3s). Optimizado para no disparar ráfagas al cambiar de pestañas.
- **Stale Data Indicator**: Alerta visual roja si la API falla o hace timeout por >15s, previniendo falsas sensaciones de seguridad si se activa el fallback a datos mockeados locales.
- **Activity Log persistente**: El log lateral guarda el historial de acciones en `localStorage` para sobrevivir recargas de página.

## Limitaciones Conocidas (Próximos pasos)

1. **Read-Only (Falta control activo)**: El dashboard es estrictamente de observabilidad. Si un agente está `overloaded` o atascado, el operador no puede pausarlo o reiniciarlo desde esta interfaz; debe usar el orquestador principal.
2. **Database load con escalabilidad**: Con 25+ agentes, el polling de 5s genera ~12 llamadas por minuto por cada cliente conectado. A gran escala, esto requerirá implementar Redis o caching nativo en la capa de la Edge Function para proteger PostgreSQL.

## Setup & Build

```bash
# Instalación
npm install

# Desarrollo
npm run dev

# Build optimizado
npm run build
npm run preview
```

## Tech Stack

- **Frontend**: React 19 + Vite 7 + TailwindCSS 4
- **Canvas**: HTML5 Canvas 2D sin librerías externas de renderizado
- **Backend**: Supabase Edge Functions (Deno)
- **Audio**: Native Web Audio API

## License

MIT
