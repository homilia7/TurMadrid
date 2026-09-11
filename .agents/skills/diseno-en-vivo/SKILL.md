---
name: diseno-en-vivo
description: >-
  Protocolo obligatorio de verificación y despliegue en tiempo real para cambios de interfaz y diseño frontend.
  Garantiza compilación local, subida directa por API a Cloudflare Pages, detección de fallos de configuración
  y verificación HTTP en vivo antes de dar por terminada cualquier tarea de diseño.
---

# Skill: Diseño en Vivo & Despliegue en Tiempo Real (Live Design & Instant Deploy)

Esta Skill define el protocolo obligatorio que **todo asistente de IA** debe ejecutar y verificar de extremo a extremo cada vez que realice ajustes de diseño, maquetación, estilos CSS o componentes frontend en este proyecto.

---

## 1. Regla de Oro de la Finalización de Tareas
> **NUNCA** declarar una tarea de diseño como "completada" únicamente porque el código local fue editado o porque se hizo `git push`. La tarea se considera terminada **ÚNICAMENTE** tras verificar que los archivos se desplegaron en Cloudflare Pages y responden correctamente en producción.

---

## 2. Arquitectura de Despliegue y Prevención de Errores

* **Backend Worker (Raíz)**:
  * Archivo: `wrangler.toml` (en la raíz).
  * Propósito: Worker API (`qchat-backend`).
  * ⚠️ **ADVERTENCIA**: **NUNCA** incluir `pages_build_output_dir` en el `wrangler.toml` de la raíz, ya que Cloudflare Pages arrojará error de configuración y bloqueará el despliegue.

* **Frontend Pages (Subdirectorio `frontend/`)**:
  * Archivo: `frontend/wrangler.toml`.
  * Propósito: Cloudflare Pages (`qchatt`).
  * Contiene: `pages_build_output_dir = "out"`.

---

## 3. Protocolo de Ejecución en 5 Pasos Obligatorios

### Paso 1: Compilación Local y Exportación Estática
Ejecutar la compilación en la carpeta `frontend/`:
```powershell
npm --prefix frontend run build
```
* Verificar que la salida indique `✓ Compiled successfully` y que la carpeta `frontend/out` contenga el nuevo bundle estático.

### Paso 2: Despliegue Directo a Cloudflare Pages por API
Para evitar fallos silenciosos en servidores remotos o colas de espera, ejecutar el despliegue directo desde la carpeta `frontend/` usando las credenciales del proyecto:
```powershell
$env:CLOUDFLARE_API_TOKEN="<TU_CLOUDFLARE_API_TOKEN>"
$env:CLOUDFLARE_ACCOUNT_ID="<TU_CLOUDFLARE_ACCOUNT_ID>"
npx wrangler pages deploy out --project-name qchatt
```
* **Comprobación**: El comando debe responder con `✨ Success!` y `✨ Deployment complete!`.

### Paso 3: Verificación HTTP en Vivo
Consultar la URL pública en producción (ej. `https://qchatt.pages.dev/super-admin` o `https://qchatt.pages.dev/onboarding`) mediante la herramienta de lectura web para confirmar que el HTML servido por los Edge Nodes de Cloudflare incluya las nuevas clases y estructura modificada.

### Paso 4: Sincronización con el Repositorio Git
Subir los cambios al repositorio central:
```powershell
git add . ; git commit -m "feat/fix: descripción del cambio de diseño" ; git push origin main
```

### Paso 5: Confirmación y Guía de Caché para el Usuario
Al notificar al usuario, incluir siempre:
1. Enlace directo a la pantalla actualizada.
2. Recordatorio de recarga forzada (`Ctrl + F5` o ventana de incógnito `Ctrl + Shift + N`) para limpiar la caché del navegador y ver el diseño en vivo al instante.
