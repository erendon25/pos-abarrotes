import React from 'react'
import { Venta, ItemCarrito, ConfiguracionEmpresa } from '../types'
import jsPDF from 'jspdf'
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

  const handleImprimir = () => {
    // No permitir imprimir si la venta está anulada
    if (venta.anulada) {
      alert('No se puede imprimir una venta anulada')
      return
    }

    // Formato para ticketera (80mm de ancho, papel continuo)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 297] // Ancho 80mm (ticket estándar), alto variable
    })

    let yPos = 5
    const pageWidth = 80
    const margin = 3
    const maxWidth = pageWidth - (margin * 2)

    // Encabezado - Nombre de la empresa (centrado)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    const nombreWidth = doc.getTextWidth(empresa.nombre)
    doc.text(empresa.nombre, (pageWidth - nombreWidth) / 2, yPos)
    yPos += 4

    // RUC
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const rucWidth = doc.getTextWidth(`RUC: ${empresa.ruc}`)
    doc.text(`RUC: ${empresa.ruc}`, (pageWidth - rucWidth) / 2, yPos)
    yPos += 3

    // Dirección
    const direccionLines = doc.splitTextToSize(empresa.direccion, maxWidth)
    direccionLines.forEach((line: string) => {
      const lineWidth = doc.getTextWidth(line)
      doc.text(line, (pageWidth - lineWidth) / 2, yPos)
      yPos += 3
    })

    // Teléfono
    const telefonoWidth = doc.getTextWidth(empresa.telefono)
    doc.text(empresa.telefono, (pageWidth - telefonoWidth) / 2, yPos)
    yPos += 5

    // BOLETA/TICKET
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const tipoTexto = esBoleta ? `BOLETA: ${numeroComprobante}` : `TICKET: ${numeroComprobante}`
    const tipoWidth = doc.getTextWidth(tipoTexto)
    doc.text(tipoTexto, (pageWidth - tipoWidth) / 2, yPos)
    yPos += 4

    // PAGO CON
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const pagoTexto = `PAGO CON: ${obtenerMetodosPagoTexto()}`
    const pagoWidth = doc.getTextWidth(pagoTexto)
    doc.text(pagoTexto, (pageWidth - pagoWidth) / 2, yPos)
    yPos += 3

    // FECHA
    const fechaTexto = formatearFecha(venta.fecha)
    const fechaTextoFormato = `FECHA: ${fechaTexto}`
    const fechaWidth = doc.getTextWidth(fechaTextoFormato)
    doc.text(fechaTextoFormato, (pageWidth - fechaWidth) / 2, yPos)
    yPos += 3

    // FACTURADO POR
    const usuarioNombre = venta.usuario?.nombre || 'SIN USUARIO'
    const usuarioTexto = `FACTURADO POR: ${usuarioNombre}`
    const usuarioWidth = doc.getTextWidth(usuarioTexto)
    doc.text(usuarioTexto, (pageWidth - usuarioWidth) / 2, yPos)
    yPos += 5

    // Línea separadora (barra azul oscura simulada)
    doc.setDrawColor(0, 0, 139) // Azul oscuro
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 3

    // Encabezado de tabla - Barra azul oscura
    doc.setFillColor(0, 0, 139) // Azul oscuro
    doc.rect(margin, yPos - 2, pageWidth - (margin * 2), 5, 'F')
    doc.setTextColor(255, 255, 255) // Texto blanco

    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text('PRODUCTO', margin + 1, yPos)
    doc.text('CANT', margin + 32, yPos)
    doc.text('PRECIO', margin + 43, yPos)
    doc.text('TOTAL', margin + 60, yPos)

    doc.setTextColor(0, 0, 0) // Volver a texto negro
    yPos += 6

    // Productos
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    venta.items.forEach((item) => {
      if (yPos > 280) {
        doc.addPage()
        yPos = 5
      }

      const precio = obtenerPrecio(item)
      const total = precio * item.cantidad

      let nombreProducto = item.producto.nombre
      if (item.producto.marca) {
        nombreProducto += ` - ${item.producto.marca}`
      }
      if (item.producto.presentacion) {
        nombreProducto += ` ${item.producto.presentacion}`
      }
      if (item.subcategoriaSeleccionada) {
        nombreProducto += ` (${item.subcategoriaSeleccionada})`
      }

      // Nombre del producto (puede ser multilínea)
      const nombreLines = doc.splitTextToSize(nombreProducto, 28)
      nombreLines.forEach((line: string, index: number) => {
        doc.text(line, margin, yPos)
        if (index === nombreLines.length - 1) {
          // En la última línea, poner cantidad, precio y total
          doc.text(item.cantidad.toString(), margin + 32, yPos)
          doc.text(`S/${precio.toFixed(2)}`, margin + 43, yPos)
          doc.text(`S/${total.toFixed(2)}`, margin + 60, yPos)
        }
        yPos += 3
      })

      if (nombreLines.length === 1) {
        yPos += 2
      }
    })

    yPos += 3

    // TOTAL
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const totalTexto = `TOTAL: S/${venta.total.toFixed(2)}`
    const totalWidth = doc.getTextWidth(totalTexto)
    doc.text(totalTexto, pageWidth - margin - totalWidth, yPos)
    yPos += 5

    // Línea punteada separadora
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.2)
    // Simular línea punteada
    for (let x = margin; x < pageWidth - margin; x += 2) {
      doc.line(x, yPos, x + 1, yPos)
    }
    yPos += 4

    // PAGO
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const pagoMonto = venta.metodosPago.reduce((sum, m) => sum + m.monto, 0)
    const pagoMontoTexto = `PAGO: S/${pagoMonto.toFixed(2)}`
    const pagoMontoWidth = doc.getTextWidth(pagoMontoTexto)
    doc.text(pagoMontoTexto, pageWidth - margin - pagoMontoWidth, yPos)
    yPos += 4

    // VUELTO
    if (venta.vuelto && venta.vuelto > 0) {
      const vueltoTexto = `VUELTO: S/${venta.vuelto.toFixed(2)}`
      const vueltoWidth = doc.getTextWidth(vueltoTexto)
      doc.text(vueltoTexto, pageWidth - margin - vueltoWidth, yPos)
      yPos += 4
    } else {
      const vueltoTexto = `VUELTO: S/0.00`
      const vueltoWidth = doc.getTextWidth(vueltoTexto)
      doc.text(vueltoTexto, pageWidth - margin - vueltoWidth, yPos)
      yPos += 4
    }

    yPos += 5

    // Pie de página
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const graciasTexto = '¡ GRACIAS POR SU COMPRA !'
    const graciasWidth = doc.getTextWidth(graciasTexto)
    doc.text(graciasTexto, (pageWidth - graciasWidth) / 2, yPos)

    // Insertar comando de impresión automática JS en el PDF
    doc.autoPrint()

    // Generar PDF
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)

    // Abrir en nueva ventana (Más confiable que iframe oculto para navegadores modernos)
    const printWindow = window.open(pdfUrl, '_blank')

    if (printWindow) {
      // Intentar forzar impresión si el autoPrint del PDF no se ejecuta
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    } else {
      // Fallback: Si el popup se bloqueó, intentar método iframe visible (1px)
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.width = '1px'
      iframe.style.height = '1px'
      iframe.style.top = '-10px'
      iframe.style.left = '-10px'
      iframe.src = pdfUrl
      document.body.appendChild(iframe)

      iframe.onload = () => {
        setTimeout(() => {
          if (iframe.contentWindow) iframe.contentWindow.print()
          // Limpieza después de imprimir (estimado)
          setTimeout(() => document.body.removeChild(iframe), 60000)
        }, 500)
      }
    }
  }

  const imprimirTicketHTML = () => {
    // Construir HTML del ticket
    const htmlContent = `
        <html>
        <head>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              margin: 0; 
              padding: 5px 10px; 
              font-size: 11px;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            
            /* Header */
            .header-title { font-size: 14px; margin-bottom: 5px; }
            .header-info { font-size: 10px; margin-bottom: 2px; }
            
            /* Separators */
            .divider { border-top: 1px solid #ddd; margin: 8px 0; }
            .divider-dashed { border-top: 1px dashed #000; margin: 8px 0; }
            
            /* Flex Rows for Info */
            .row-flex { display: flex; justify-content: space-between; margin-bottom: 3px; }
            
            /* Table */
            .table-container { margin-top: 10px; width: 100%; }
            .table-header { 
              background-color: #000080; /* Navy Blue */
              color: white; 
              font-weight: bold;
              padding: 4px 2px;
              display: flex;
              font-size: 10px;
            }
            .col-prod { width: 45%; text-align: left; }
            .col-cant { width: 15%; text-align: center; }
            .col-precio { width: 20%; text-align: right; }
            .col-total { width: 20%; text-align: right; }
            
            .table-row {
              display: flex;
              border-bottom: 1px solid #eee;
              padding: 5px 0;
              align-items: flex-start; /* Align top for multiline */
            }
            
            .prod-name { font-size: 10px; }
            
            /* Totals */
            .total-section { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 5px; }
            .payment-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
            
            .footer { margin-top: 15px; font-size: 12px; }
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
