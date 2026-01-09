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
      direccion: 'AV. PORONGOCHE 701 - PAUCARPA',
      telefono: '933424625 / 999999999'
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

    // Abrir en nueva ventana para imprimir
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    const printWindow = window.open(pdfUrl, '_blank')
    
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => {
            printWindow.close()
            URL.revokeObjectURL(pdfUrl)
          }, 1000)
        }, 500)
      }
    } else {
      // Si no se puede abrir ventana, descargar directamente
      doc.save(`${numeroComprobante}.pdf`)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="comprobante-container" onClick={(e) => e.stopPropagation()}>
        <div className="comprobante-header">
          <h2>{esBoleta ? 'BOLETA' : 'TICKET'}</h2>
          <div className="comprobante-acciones">
            <button 
              className={`btn-imprimir ${venta.anulada ? 'disabled' : ''}`}
              onClick={handleImprimir}
              disabled={venta.anulada}
              title={venta.anulada ? "No se puede imprimir una venta anulada" : "Imprimir PDF"}
            >
              🖨️ Imprimir PDF
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
