# Any Boutique — estado de implementación

Versión local de demostración. No usar todavía como sistema operativo del negocio.

## Ejecutar

- `npm install` (solo si faltan dependencias).
- `npm run dev` abre el servidor local; visitar la dirección que indique Vite.
- `npm run build` genera la aplicación.
- `npm run lint` revisa el código.
- `npm test` verifica reglas de inventario, ventas y compras.

## Funciona actualmente

- Inventario por SKU, talla y color; búsqueda y filtros; alta y edición.
- Conteos físicos con motivo y movimiento de ajuste.
- Ventas de varias líneas con referencia única, validación de stock y anulación completa auditada.
- Alta de proveedores y selección en órdenes.
- Órdenes pendientes, aprobación/rechazo y recepción completa con referencia documental. Aprobar no aumenta stock; recibir sí. No se puede recibir dos veces.
- Alertas por mínimos/máximos y órdenes desde alertas.
- Historial de movimientos, reportes derivados de operaciones locales, configuración y descarga de respaldo JSON.
- Datos persistidos en localStorage (clave `any-boutique-demo-v1`). No hay envío a un servidor. Cada navegador mantiene su propia copia.

## Pendientes para completar el sistema

- Supabase: esquema, migraciones, autenticación, usuarios, permisos RLS y operaciones transaccionales en servidor. Los botones actuales no representan autorización segura.
- Inicio de sesión y panel inicial. Figma devolvió límite de consultas para esos nodos; tampoco se obtuvo el contexto de alta de producto ni del listado de proveedores. El alta provisional usa un diálogo funcional y los proveedores se resumen en Compras.
- Recepciones parciales, incidencias por daños/faltantes y devoluciones parciales.
- Importación validada e integración con Caja, conciliación y manejo de ventas ya realizadas con stock insuficiente.
- Solicitudes de compra separadas, cotizaciones, edición de proveedores, archivos e imágenes reales.
- Alertas persistentes con estados y baja rotación (el parámetro se guarda pero no se evalúa todavía).
- Reportes completos de exactitud, costos históricos/valoración y desempeño de proveedores.
- Restauración validada de respaldos y concurrencia entre equipos.

## Diseño

Referencia: Figma `Nox0kMWlVwMjg80ZlswsxS`, página `2020:2`. Se obtuvo contexto detallado para inventario, listado/registro de ventas, listado/registro de compras, alta de proveedor, reportes, alertas y configuración. La interfaz adapta esa estructura a controles funcionales y pantallas estrechas; no se afirma equivalencia visual completa de las 14 pantallas.

Actualización visual: el Figma se utiliza como referencia de distribución y tamaños. La aplicación usa una paleta pastel lavanda, rosa, salvia y crema, con íconos SVG semánticos en lugar de los marcadores provisionales. No se incorporaron fotografías ni imágenes generadas. Tipografías Inter y DM Serif Display almacenadas localmente. No hay URLs temporales de Figma en tiempo de ejecución.

## Comprobación

Cinco pruebas automáticas de dominio y compilación/lint. En navegador se confirmó una venta de demostración y su anulación; el stock de BL-001 volvió a 18. El historial conserva esa prueba con referencia `PRUEBA-LOCAL-001` en el navegador de revisión. Se revisó inventario en tamaño estrecho y escritorio (1440 × 1024).

Los cambios previos en App.css e index.css se copiaron a work antes de sustituirlos. index.html no se modificó.

