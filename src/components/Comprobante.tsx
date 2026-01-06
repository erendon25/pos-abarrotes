import { Venta, ItemCarrito } from '../types'
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

  const esFactura = !!venta.factura
  const numeroComprobante = esFactura ? venta.numeroFactura : venta.numeroBoleta
  const tipoComprobante = esFactura ? 'FACTURA' : 'BOLETA DE VENTA'

  const formatearFecha = (fecha: Date) => {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleImprimir = () => {
    // Formato para ticketera (80mm de ancho, papel continuo)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 297] // Ancho 80mm (ticket estándar), alto variable
    })

    let yPos = 10
    const pageWidth = 80
    const margin = 5
    const maxWidth = pageWidth - (margin * 2)

    // Encabezado (centrado para ticketera)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    const tituloWidth = doc.getTextWidth(tipoComprobante)
    doc.text(tipoComprobante, (pageWidth - tituloWidth) / 2, yPos)
    yPos += 8
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const numeroWidth = doc.getTextWidth(`Número: ${numeroComprobante}`)
    doc.text(`Número: ${numeroComprobante}`, (pageWidth - numeroWidth) / 2, yPos)
    yPos += 6
    
    const fechaTexto = formatearFecha(venta.fecha)
    const fechaWidth = doc.getTextWidth(`Fecha: ${fechaTexto}`)
    doc.text(`Fecha: ${fechaTexto}`, (pageWidth - fechaWidth) / 2, yPos)
    yPos += 8
    
    // Línea separadora
    doc.setDrawColor(0, 0, 0)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    // Datos del cliente (solo para factura)
    if (esFactura && venta.factura) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Datos del Cliente', margin, yPos)
      yPos += 6

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const rucLines = doc.splitTextToSize(`RUC: ${venta.factura.ruc}`, maxWidth)
      doc.text(rucLines, margin, yPos)
      yPos += 5
      
      const razonLines = doc.splitTextToSize(`Razón Social: ${venta.factura.razonSocial}`, maxWidth)
      doc.text(razonLines, margin, yPos)
      yPos += razonLines.length * 5 + 5
      
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 5
    }

    // Detalle de productos
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalle de Productos', margin, yPos)
    yPos += 6
    
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    // Productos (formato vertical para ticketera)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    venta.items.forEach((item, index) => {
      // Verificar si necesitamos nueva página
      if (yPos > 280) {
        doc.addPage()
        yPos = 10
      }

      const precio = obtenerPrecio(item)
      const total = precio * item.cantidad
      
      let nombreProducto = item.producto.nombre
      if (item.subcategoriaSeleccionada) {
        nombreProducto += ` (${item.subcategoriaSeleccionada})`
      }

      // Nombre del producto
      const nombreLines = doc.splitTextToSize(nombreProducto, maxWidth)
      doc.text(nombreLines, margin, yPos)
      yPos += nombreLines.length * 4
      
      // Cantidad, precio y total en una línea
      doc.text(`${item.cantidad} x S/ ${precio.toFixed(2)} = S/ ${total.toFixed(2)}`, margin, yPos)
      yPos += 6
    })

    yPos += 5
    doc.setDrawColor(0, 0, 0)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6

    // Totales (alineados a la derecha)
    doc.setFontSize(9)
    if (esFactura && venta.factura) {
      // Para factura: Precio Neto, IGV, Total
      const porcentajeIGV = 18
      const totalConAdicionales = venta.total
      const precioNeto = totalConAdicionales / (1 + porcentajeIGV / 100)
      const igv = totalConAdicionales - precioNeto

      doc.setFont('helvetica', 'normal')
      const precioNetoText = `Precio Neto: S/ ${precioNeto.toFixed(2)}`
      const precioNetoWidth = doc.getTextWidth(precioNetoText)
      doc.text(precioNetoText, pageWidth - margin - precioNetoWidth, yPos)
      yPos += 6

      const igvText = `IGV (18%): S/ ${igv.toFixed(2)}`
      const igvWidth = doc.getTextWidth(igvText)
      doc.text(igvText, pageWidth - margin - igvWidth, yPos)
      yPos += 6

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      const totalText = `TOTAL: S/ ${totalConAdicionales.toFixed(2)}`
      const totalWidth = doc.getTextWidth(totalText)
      doc.text(totalText, pageWidth - margin - totalWidth, yPos)
    } else {
      // Para boleta: Subtotal y Total
      const subtotal = venta.items.reduce((sum, item) => {
        const precio = obtenerPrecio(item)
        return sum + (precio * item.cantidad)
      }, 0)

      doc.setFont('helvetica', 'normal')
      const subtotalText = `Subtotal: S/ ${subtotal.toFixed(2)}`
      const subtotalWidth = doc.getTextWidth(subtotalText)
      doc.text(subtotalText, pageWidth - margin - subtotalWidth, yPos)
      yPos += 6

      if (venta.porcentajeTarjeta) {
        const adicionalTarjeta = venta.total - subtotal
        const adicionalText = `Adicional tarjeta: S/ ${adicionalTarjeta.toFixed(2)}`
        const adicionalLines = doc.splitTextToSize(adicionalText, maxWidth)
        doc.text(adicionalLines, margin, yPos)
        yPos += adicionalLines.length * 5
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      const totalText = `TOTAL: S/ ${venta.total.toFixed(2)}`
      const totalWidth = doc.getTextWidth(totalText)
      doc.text(totalText, pageWidth - margin - totalWidth, yPos)
    }

    yPos += 10
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6

    // Forma de pago
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Forma de Pago', margin, yPos)
    yPos += 6

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    venta.metodosPago.forEach((metodo) => {
      const metodoTexto = metodo.tipo === 'efectivo' ? 'Efectivo' :
                          metodo.tipo === 'yape' ? 'Yape' :
                          'Tarjeta'
      const metodoText = `${metodoTexto}: S/ ${metodo.monto.toFixed(2)}`
      const metodoWidth = doc.getTextWidth(metodoText)
      doc.text(metodoText, pageWidth - margin - metodoWidth, yPos)
      yPos += 5
    })

    if (venta.vuelto && venta.vuelto > 0) {
      yPos += 3
      doc.setFont('helvetica', 'bold')
      const vueltoText = `Vuelto: S/ ${venta.vuelto.toFixed(2)}`
      const vueltoWidth = doc.getTextWidth(vueltoText)
      doc.text(vueltoText, pageWidth - margin - vueltoWidth, yPos)
    }

    yPos += 10
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8
    
    // Pie de página
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Gracias por su compra', (pageWidth - doc.getTextWidth('Gracias por su compra')) / 2, yPos)

    // Abrir en nueva ventana para imprimir
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    const printWindow = window.open(pdfUrl, '_blank')
    
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // Cerrar la ventana después de un tiempo
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
          <h2>{tipoComprobante}</h2>
          <div className="comprobante-acciones">
            <button className="btn-imprimir" onClick={handleImprimir}>
              🖨️ Imprimir PDF
            </button>
            <button className="btn-cerrar" onClick={onCerrar}>×</button>
          </div>
        </div>

        <div className="comprobante-body">
          <div className="comprobante-info">
            <div className="comprobante-numero">
              <span className="label">Número:</span>
              <span className="valor">{numeroComprobante}</span>
            </div>
            <div className="comprobante-fecha">
              <span className="label">Fecha:</span>
              <span className="valor">{formatearFecha(venta.fecha)}</span>
            </div>
          </div>

          {esFactura && venta.factura && (
            <div className="comprobante-cliente">
              <h3>Datos del Cliente</h3>
              <div className="cliente-info">
                <div>
                  <span className="label">RUC:</span>
                  <span className="valor">{venta.factura.ruc}</span>
                </div>
                <div>
                  <span className="label">Razón Social:</span>
                  <span className="valor">{venta.factura.razonSocial}</span>
                </div>
              </div>
            </div>
          )}

          <div className="comprobante-detalle">
            <h3>Detalle de Productos</h3>
            <table className="tabla-detalle">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {venta.items.map((item, index) => {
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
                })}
              </tbody>
            </table>
          </div>

          <div className="comprobante-totales">
            {esFactura && venta.factura ? (
              <>
                {/* Para factura: desglosar en precio neto e IGV */}
                {(() => {
                  // El IGV siempre es 18% en Perú
                  const porcentajeIGV = 18
                  // El total ya incluye todos los adicionales (porcentaje interno + tarjeta si aplica)
                  const totalConAdicionales = venta.total
                  
                  // Precio neto = Total / (1 + IGV/100)
                  // El IGV siempre es 18%
                  const precioNeto = totalConAdicionales / (1 + porcentajeIGV / 100)
                  const igv = totalConAdicionales - precioNeto
                  
                  return (
                    <>
                      <div className="total-line">
                        <span>Precio Neto:</span>
                        <span>S/ {precioNeto.toFixed(2)}</span>
                      </div>
                      <div className="total-line">
                        <span>IGV (18%):</span>
                        <span>S/ {igv.toFixed(2)}</span>
                      </div>
                      <div className="total-line total-final">
                        <span>Total:</span>
                        <span>S/ {totalConAdicionales.toFixed(2)}</span>
                      </div>
                    </>
                  )
                })()}
              </>
            ) : (
              <>
                {/* Para boleta: mostrar subtotal y total */}
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>S/ {venta.items.reduce((sum, item) => {
                    const precio = obtenerPrecio(item)
                    return sum + (precio * item.cantidad)
                  }, 0).toFixed(2)}</span>
                </div>
                {venta.porcentajeTarjeta && (
                  <div className="total-line">
                    <span>Adicional por tarjeta ({venta.porcentajeTarjeta}%):</span>
                    <span>S/ {(venta.total - venta.items.reduce((sum, item) => {
                      const precio = obtenerPrecio(item)
                      return sum + (precio * item.cantidad)
                    }, 0)).toFixed(2)}</span>
                  </div>
                )}
                <div className="total-line total-final">
                  <span>Total:</span>
                  <span>S/ {venta.total.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="comprobante-pago">
            <h3>Forma de Pago</h3>
            <div className="metodos-pago-comprobante">
              {venta.metodosPago.map((metodo, index) => (
                <div key={index} className="metodo-pago-comprobante">
                  <span className="metodo-tipo">
                    {metodo.tipo === 'efectivo' && '💵 Efectivo'}
                    {metodo.tipo === 'yape' && '📱 Yape'}
                    {metodo.tipo === 'tarjeta' && '💳 Tarjeta'}
                  </span>
                  <span className="metodo-monto">S/ {metodo.monto.toFixed(2)}</span>
                </div>
              ))}
            </div>
            {venta.vuelto && venta.vuelto > 0 && (
              <div className="vuelto-comprobante">
                <span>Vuelto:</span>
                <span>S/ {venta.vuelto.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
