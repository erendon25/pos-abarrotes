# POS Abarrotes

Sistema de punto de venta moderno para tienda de abarrotes desarrollado con React + TypeScript.

## Características

- 🛒 **Gestión de ventas**: Procesamiento rápido de ventas con múltiples métodos de pago
- 📦 **Control de inventario**: Gestión completa de productos, categorías y subcategorías
- 📊 **Reportes**: Análisis de ventas por categoría, subcategoría, método de pago y fechas
- 🏷️ **Códigos de barras**: Soporte para lectora de códigos de barras
- 🧾 **Comprobantes**: Generación de boletas y facturas con numeración secuencial
- ⚙️ **Configuración**: Personalización de numeración y porcentajes

## Tecnologías

- React 18
- TypeScript
- Vite
- jsPDF (para generación de PDFs)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Construcción

```bash
npm run build
```

## Características principales

### Ventas
- Lista de productos con búsqueda en tiempo real
- Carrito de compras compacto
- Múltiples métodos de pago (Efectivo, Yape, Tarjeta)
- Cálculo automático de vuelto
- Soporte para facturas con IGV
- Porcentaje adicional por pago con tarjeta

### Almacén
- Gestión de productos (agregar, editar, eliminar)
- Control de stock
- Precios por subcategoría
- Códigos de barras
- Gestión de categorías y subcategorías

### Reportes
- Venta total
- Ventas por método de pago
- Ventas por categoría y subcategoría
- Productos más y menos vendidos
- Filtros por fecha

### Comprobantes
- Boletas de venta con numeración secuencial
- Facturas con desglose de IGV
- Generación de PDF optimizado para ticketera
- Impresión directa

## Configuración

En el apartado de Configuración puedes:
- Establecer prefijos y secuencias para boletas y facturas
- Configurar porcentajes de IGV y comisión por tarjeta

## Licencia

Este proyecto es de uso privado.

