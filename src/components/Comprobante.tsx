import React from 'react'
import { Venta, ItemCarrito, ConfiguracionEmpresa } from '../types'

import './Comprobante.css'

interface ComprobanteProps {
  venta: Venta
  onCerrar: () => void
}

export default function Comprobante({ venta, onCerrar }: ComprobanteProps) {
  const obtenerPrecio = (item: ItemCarrito) => {
    if (item.subcategoriaSeleccionada && item.producto.preciosPorSubcategoria) {
      return item.producto.preciosPorSubcategoria[item.subcategoriaSeleccionada] || item.producto.precio
    }
    return item.producto.precio
  }

  // Obtener datos de empresa desde localStorage
  const obtenerEmpresa = (): ConfiguracionEmpresa => {
    const empresaGuardada = localStorage.getItem('pos_empresa')
    if (empresaGuardada) {
      return JSON.parse(empresaGuardada)
    }
    return {
      nombre: 'MINIMARKET COOL MARKET',
      ruc: '10444309852',
      direccion: 'AV. PORONGOCHE 701 - PAUCARPATA',
      telefono: '933424625'
    }
  }

  const empresa = obtenerEmpresa()
  const esBoleta = venta.tipoComprobante === 'boleta'
  const numeroComprobante = esBoleta ? venta.numeroBoleta : venta.numeroTicket

  const formatearFecha = (fecha: Date) => {
    const date = new Date(fecha)
    const dia = date.getDate().toString().padStart(2, '0')
    const mes = (date.getMonth() + 1).toString().padStart(2, '0')
    const año = date.getFullYear()
    const horas = date.getHours().toString().padStart(2, '0')
    const minutos = date.getMinutes().toString().padStart(2, '0')
    return `${dia}/${mes}/${año} ${horas}:${minutos}`
  }

  const obtenerMetodosPagoTexto = (): string => {
    const metodos = venta.metodosPago.map(m => {
      if (m.tipo === 'efectivo') return 'Soles'
      if (m.tipo === 'yape') return 'Yape'
      if (m.tipo === 'tarjeta') return 'Tarjeta'
      return m.tipo
    })
    return metodos.join('/')
  }



  const imprimirTicketHTML = () => {
    // Construir HTML del ticket
    const htmlContent = `
        <html>
        <head>
          <style>
            @page { margin: 0; size: auto; }
            * { box-sizing: border-box; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 72mm; /* Safe printable width for 80mm paper */
              margin: 0 auto; 
              padding: 2mm; 
              font-size: 11px;
              color: #000;
              overflow: hidden;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            
            /* Header */
            .header-title { font-size: 14px; margin-bottom: 5px; word-break: break-word; }
            .header-info { font-size: 10px; margin-bottom: 2px; }
            
            /* Separators */
            .divider { border-top: 1px solid #ddd; margin: 5px 0; }
            .divider-dashed { border-top: 1px dashed #000; margin: 5px 0; }
            
            /* Flex Rows for Info */
            .row-flex { display: flex; justify-content: space-between; margin-bottom: 2px; }
            
            /* Table */
            .table-container { margin-top: 5px; width: 100%; }
            .table-header { 
              background-color: #000; /* Black for better contrast */
              color: white; 
              font-weight: bold;
              padding: 2px 0;
              display: flex;
              font-size: 9px;
            }
            .col-prod { width: 40%; text-align: left; padding-left: 2px; }
            .col-cant { width: 15%; text-align: center; }
            .col-precio { width: 20%; text-align: right; }
            .col-total { width: 25%; text-align: right; padding-right: 2px; }
            
            .table-row {
              display: flex;
              border-bottom: 1px dotted #000;
              padding: 4px 0;
              align-items: flex-start;
            }
            
            .prod-name { font-size: 10px; word-break: break-word; text-align: left; }
            
            /* Totals */
            .total-section { margin-top: 5px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-bottom: 2px; }
            .payment-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
            
            .footer { margin-top: 10px; font-size: 10px; padding-bottom: 5px;}
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="center bold header-title uppercase">${empresa.nombre}</div>
          <div class="center header-info">RUC: ${empresa.ruc}</div>
          <div class="center header-info uppercase">${empresa.direccion}</div>
          <div class="center header-info">${empresa.telefono}</div>
          
          <div class="divider"></div>
          
          <!-- Order Info -->
          <div class="row-flex">
            <span>${esBoleta ? 'BOLETA' : 'TICKET'}:</span>
            <span>${numeroComprobante}</span>
          </div>
          <div class="row-flex">
            <span>PAGO CON:</span>
            <span>${obtenerMetodosPagoTexto()}</span>
          </div>
          <div class="row-flex">
            <span>FECHA:</span>
            <span>${formatearFecha(venta.fecha)}</span>
          </div>
          <div class="row-flex">
            <span>FACTURADO POR:</span>
            <span class="uppercase">${venta.usuario?.nombre || 'General'}</span>
          </div>
          
          <!-- Table -->
          <div class="table-container">
            <div class="table-header uppercase">
              <div class="col-prod">PRODUCTO</div>
              <div class="col-cant">CANT</div>
              <div class="col-precio">PRECIO</div>
              <div class="col-total">TOTAL</div>
            </div>
            
            ${venta.items.map(item => {
      const precio = obtenerPrecio(item);
      const total = precio * item.cantidad;
      let nombre = item.producto.nombre;
      if (item.producto.marca) nombre += ` ${item.producto.marca}`;
      if (item.subcategoriaSeleccionada) nombre += ` (${item.subcategoriaSeleccionada})`;

      return `
                <div class="table-row">
                  <div class="col-prod prod-name">${nombre}</div>
                  <div class="col-cant">${item.cantidad}</div>
                  <div class="col-precio">S/ ${precio.toFixed(2)}</div>
                  <div class="col-total">S/ ${total.toFixed(2)}</div>
                </div>
                `;
    }).join('')}
          </div>
          
          <!-- Totals -->
          <div class="total-section">
             <div class="divider"></div>
             
             <div class="total-row">
               <span>TOTAL:</span>
               <span>S/ ${venta.total.toFixed(2)}</span>
             </div>
             
             <div class="divider-dashed"></div>
             
             <div class="payment-row">
               <span>PAGO:</span>
               <span>S/ ${venta.metodosPago.reduce((acc, m) => acc + m.monto, 0).toFixed(2)}</span>
             </div>
             <div class="payment-row">
               <span>VUELTO:</span>
               <span>S/ ${(venta.vuelto || 0).toFixed(2)}</span>
             </div>
          </div>
          
          <!-- Footer -->
           <div class="divider"></div>
          <div class="center bold footer uppercase">
            ¡ GRACIAS POR SU COMPRA !
          </div>
        </body>
        </html>
      `;

    // Detectar Electron y usar impresión silenciosa si está disponible
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.send('print-silent', htmlContent);
        return; // Salir de la función, ya lo manejó Electron
      } catch (error) {
        console.error("Error al intentar imprimir vía Electron:", error);
      }
    }

    // Fallback para navegador web (muestra diálogo)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Esperar a que cargue imagen/fuentes si hubiera
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Remover después de imprimir
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    }
  }

  // Ref para evitar doble impresión
  const printedRef = React.useRef(false)

  // Auto-imprimir al cargar el componente
  React.useEffect(() => {
    if (!venta.anulada && !printedRef.current) {
      printedRef.current = true
      // Trigger HTML print automatically
      setTimeout(() => {
        imprimirTicketHTML()
      }, 500)
    }
  }, [])

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="comprobante-container" onClick={(e) => e.stopPropagation()}>
        <div className="comprobante-header">
          <h2>{esBoleta ? 'BOLETA' : 'TICKET'}</h2>
          <div className="comprobante-acciones">
            <button
              className={`btn-imprimir ${venta.anulada ? 'disabled' : ''}`}
              onClick={imprimirTicketHTML}
              disabled={venta.anulada}
              title={venta.anulada ? "No se puede imprimir una venta anulada" : "Imprimir Ticket"}
            >
              🖨️ Imprimir
            </button>
            <button className="btn-cerrar" onClick={onCerrar}>×</button>
          </div>
        </div>

        <div className="comprobante-body">
          {/* Encabezado de empresa */}
          <div className="comprobante-empresa">
            <h1 className="empresa-nombre">{empresa.nombre}</h1>
            <div className="empresa-datos">
              <div>RUC: {empresa.ruc}</div>
              <div>{empresa.direccion}</div>
              <div>{empresa.telefono}</div>
            </div>
          </div>

          {/* Información del comprobante */}
          <div className="comprobante-info-ticket">
            <div className="info-line">
              <span className="info-label">{esBoleta ? 'BOLETA' : 'TICKET'}:</span>
              <span className="info-value">{numeroComprobante}</span>
            </div>
            <div className="info-line">
              <span className="info-label">PAGO CON:</span>
              <span className="info-value">{obtenerMetodosPagoTexto()}</span>
            </div>
            <div className="info-line">
              <span className="info-label">FECHA:</span>
              <span className="info-value">{formatearFecha(venta.fecha)}</span>
            </div>
            <div className="info-line">
              <span className="info-label">FACTURADO POR:</span>
              <span className="info-value">{venta.usuario?.nombre || 'SIN USUARIO'}</span>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="comprobante-detalle">
            <table className="tabla-detalle-ticket">
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th>CANT</th>
                  <th>PRECIO</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {venta.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>
                      No hay productos
                    </td>
                  </tr>
                ) : (
                  venta.items.map((item, index) => {
                    const precio = obtenerPrecio(item)
                    const total = precio * item.cantidad
                    return (
                      <tr key={index}>
                        <td>
                          {item.producto.nombre}
                          {item.producto.marca && (
                            <span className="marca-badge-comprobante"> {item.producto.marca}</span>
                          )}
                          {item.producto.presentacion && (
                            <span className="presentacion-badge-comprobante"> {item.producto.presentacion}</span>
                          )}
                          {item.subcategoriaSeleccionada && (
                            <span className="subcategoria-badge-comprobante">
                              {item.subcategoriaSeleccionada}
                            </span>
                          )}
                        </td>
                        <td className="text-center">{item.cantidad}</td>
                        <td className="text-right">S/ {precio.toFixed(2)}</td>
                        <td className="text-right">S/ {total.toFixed(2)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="comprobante-total">
            <div className="total-line-ticket">
              <span>TOTAL:</span>
              <span>S/ {venta.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Línea punteada separadora */}
          <div className="linea-separadora"></div>

          {/* Resumen de pago */}
          <div className="comprobante-resumen-pago">
            <div className="resumen-line">
              <span>PAGO:</span>
              <span>S/ {venta.metodosPago.reduce((sum, m) => sum + m.monto, 0).toFixed(2)}</span>
            </div>
            <div className="resumen-line">
              <span>VUELTO:</span>
              <span>S/ {(venta.vuelto || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Pie de página */}
          <div className="comprobante-pie">
            <div className="pie-texto">¡ GRACIAS POR SU COMPRA !</div>
          </div>
        </div>
      </div>
    </div>
  )
}
