import { useState } from 'react'
import { Cliente, MetodoPago, Venta } from '../types'
import './Clientes.css'

interface ClientesProps {
    clientes: Cliente[]
    setClientes: (clientes: Cliente[]) => void
    onRegistrarPago: (clienteId: string, monto: number, metodoPago: MetodoPago['tipo']) => void
    ventas: Venta[]
}

export default function Clientes({ clientes, setClientes, onRegistrarPago, ventas }: ClientesProps) {
    const [mostrarModal, setMostrarModal] = useState(false)
    const [mostrarModalPago, setMostrarModalPago] = useState(false)
    const [mostrarModalCredito, setMostrarModalCredito] = useState(false)
    const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false)

    // Edit/Create State
    const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null)
    const [nombre, setNombre] = useState('')
    const [telefono, setTelefono] = useState('')

    // Payment State
    const [clientePago, setClientePago] = useState<Cliente | null>(null)
    const [montoPago, setMontoPago] = useState('')
    const [metodoPago, setMetodoPago] = useState<MetodoPago['tipo']>('efectivo')

    // Edit Credit State
    const [clienteCredito, setClienteCredito] = useState<Cliente | null>(null)
    const [nuevoCredito, setNuevoCredito] = useState('')
    const [motivoAjuste, setMotivoAjuste] = useState('')

    // Historial State
    const [clienteHistorial, setClienteHistorial] = useState<Cliente | null>(null)

    const abrirModalCliente = (cliente?: Cliente) => {
        if (cliente) {
            setClienteEditar(cliente)
            setNombre(cliente.nombre)
            setTelefono(cliente.telefono || '')
        } else {
            setClienteEditar(null)
            setNombre('')
            setTelefono('')
        }
        setMostrarModal(true)
    }

    const guardarCliente = (e: React.FormEvent) => {
        e.preventDefault()

        if (clienteEditar) {
            const actualizados = clientes.map(c =>
                c.id === clienteEditar.id
                    ? { ...c, nombre, telefono }
                    : c
            )
            setClientes(actualizados)
        } else {
            const nuevo: Cliente = {
                id: Date.now().toString(),
                nombre,
                telefono,
                deudaActual: 0
            }
            setClientes([...clientes, nuevo])
        }
        setMostrarModal(false)
    }

    const eliminarCliente = (id: string) => {
        if (!confirm("¿Eliminar este cliente? Sus deudas se perderán visualmente.")) return
        setClientes(clientes.filter(c => c.id !== id))
    }

    const abrirModalPago = (cliente: Cliente) => {
        setClientePago(cliente)
        setMontoPago(cliente.deudaActual.toString())
        setMetodoPago('efectivo')
        setMostrarModalPago(true)
    }

    const confirmarPago = (e: React.FormEvent) => {
        e.preventDefault()
        if (!clientePago) return

        const monto = parseFloat(montoPago)
        if (isNaN(monto) || monto <= 0) {
            alert("Ingrese un monto válido")
            return
        }

        if (monto > clientePago.deudaActual) {
            if (!confirm(`El monto ingresado (S/ ${monto}) es mayor a la deuda (S/ ${clientePago.deudaActual}). ¿Desea continuar y dejar saldo a favor?`)) {
                return
            }
        }

        // 1. Update debt locally
        const nuevoSaldo = clientePago.deudaActual - monto
        const actualizados = clientes.map(c =>
            c.id === clientePago.id
                ? { ...c, deudaActual: nuevoSaldo }
                : c
        )
        setClientes(actualizados)

        // 2. Register Payment Transaction
        onRegistrarPago(clientePago.id, monto, metodoPago)

        alert("Pago registrado correctamente")
        setMostrarModalPago(false)
    }

    // Edit Credit Functions
    const abrirModalCredito = (cliente: Cliente) => {
        setClienteCredito(cliente)
        setNuevoCredito(cliente.deudaActual.toString())
        setMotivoAjuste('')
        setMostrarModalCredito(true)
    }

    const confirmarEdicionCredito = (e: React.FormEvent) => {
        e.preventDefault()
        if (!clienteCredito) return

        const monto = parseFloat(nuevoCredito)
        if (isNaN(monto) || monto < 0) {
            alert("Ingrese un monto válido (0 o mayor)")
            return
        }

        if (!motivoAjuste.trim()) {
            alert("Debe ingresar un motivo para el ajuste")
            return
        }

        const diferencia = monto - clienteCredito.deudaActual

        // Update debt locally
        const actualizados = clientes.map(c =>
            c.id === clienteCredito.id
                ? { ...c, deudaActual: monto }
                : c
        )
        setClientes(actualizados)

        const accion = diferencia > 0 ? 'aumentó' : diferencia < 0 ? 'redujo' : 'mantuvo'
        console.log(`Crédito de ${clienteCredito.nombre} ${accion} de S/ ${clienteCredito.deudaActual} a S/ ${monto}. Motivo: ${motivoAjuste}`)

        alert(`Crédito actualizado correctamente.\nDiferencia: ${diferencia >= 0 ? '+' : ''}S/ ${diferencia.toFixed(2)}\nMotivo: ${motivoAjuste}`)
        setMostrarModalCredito(false)
    }

    // Historial Functions
    const abrirModalHistorial = (cliente: Cliente) => {
        setClienteHistorial(cliente)
        setMostrarModalHistorial(true)
    }

    const obtenerHistorialCliente = (clienteId: string) => {
        return ventas
            .filter(v => v.clienteId === clienteId || v.metodosPago.some(m => m.tipo === 'credito'))
            .filter(v => v.clienteId === clienteId)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    }

    const formatearFecha = (fecha: Date) => {
        return new Date(fecha).toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="clientes-container">
            <div className="clientes-header">
                <div>
                    <h2>Gestión de Clientes y Cuentas por Cobrar</h2>
                    <p>Administra clientes, registra pagos de deuda y consulta historiales.</p>
                </div>
                <button className="btn-nuevo-cliente" onClick={() => abrirModalCliente()}>
                    + Nuevo Cliente
                </button>
            </div>

            <div className="clientes-list">
                <table className="tabla-clientes">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Deuda Actual</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length === 0 ? (
                            <tr><td colSpan={4} className="text-center">No hay clientes registrados</td></tr>
                        ) : (
                            clientes.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <span
                                            className="nombre-cliente-clickable"
                                            onClick={() => abrirModalHistorial(c)}
                                            title="Ver historial de compras"
                                        >
                                            {c.nombre}
                                        </span>
                                    </td>
                                    <td>{c.telefono || '-'}</td>
                                    <td>
                                        <span className={c.deudaActual > 0 ? 'saldo-negativo' : 'saldo-positivo'}>
                                            S/ {c.deudaActual.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="acciones-cliente">
                                            <button
                                                className="btn-historial"
                                                onClick={() => abrirModalHistorial(c)}
                                                title="Ver historial"
                                            >
                                                📋 Historial
                                            </button>
                                            <button
                                                className="btn-editar-credito"
                                                onClick={() => abrirModalCredito(c)}
                                                title="Editar crédito"
                                            >
                                                ✏️ Crédito
                                            </button>
                                            {c.deudaActual > 0 && (
                                                <button className="btn-pagar-deuda" onClick={() => abrirModalPago(c)}>
                                                    💸 Pagar
                                                </button>
                                            )}
                                            <button className="btn-icon edit" onClick={() => abrirModalCliente(c)}>✏️</button>
                                            <button className="btn-icon delete" onClick={() => eliminarCliente(c.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Cliente */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{clienteEditar ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                        <form onSubmit={guardarCliente}>
                            <div className="form-group-modal">
                                <label>Nombre Completo</label>
                                <input required value={nombre} onChange={e => setNombre(e.target.value)} autoFocus />
                            </div>
                            <div className="form-group-modal">
                                <label>Teléfono</label>
                                <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Agrega un numero" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setMostrarModal(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Pago Deuda */}
            {mostrarModalPago && clientePago && (
                <div className="modal-overlay">
                    <div className="modal-pago-deuda">
                        <h3>Registrar Pago de Deuda</h3>
                        <p>Cliente: <strong>{clientePago.nombre}</strong></p>
                        <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '4px', color: '#991b1b' }}>
                            Deuda Total: <strong>S/ {clientePago.deudaActual.toFixed(2)}</strong>
                        </div>

                        <form onSubmit={confirmarPago}>
                            <div className="form-group-modal">
                                <label>Monto a Pagar (S/)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={montoPago}
                                    onChange={e => setMontoPago(e.target.value)}
                                    max={clientePago.deudaActual} // Optional soft limit
                                />
                            </div>
                            <div className="form-group-modal">
                                <label>Medio de Pago</label>
                                <select
                                    value={metodoPago}
                                    onChange={e => setMetodoPago(e.target.value as any)}
                                    className="input-select"
                                >
                                    <option value="efectivo">Efectivo (Caja)</option>
                                    <option value="yape">Yape</option>
                                    <option value="tarjeta">Tarjeta</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setMostrarModalPago(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save" style={{ background: '#10b981' }}>Confirmar Pago</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Crédito */}
            {mostrarModalCredito && clienteCredito && (
                <div className="modal-overlay">
                    <div className="modal-content modal-credito">
                        <h3>✏️ Editar Crédito</h3>
                        <p>Cliente: <strong>{clienteCredito.nombre}</strong></p>
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', color: '#92400e' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Crédito Actual:</span>
                                <strong>S/ {clienteCredito.deudaActual.toFixed(2)}</strong>
                            </div>
                        </div>

                        <form onSubmit={confirmarEdicionCredito}>
                            <div className="form-group-modal">
                                <label>Nuevo Monto de Crédito (S/)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={nuevoCredito}
                                    onChange={e => setNuevoCredito(e.target.value)}
                                    autoFocus
                                />
                                {parseFloat(nuevoCredito) !== clienteCredito.deudaActual && (
                                    <div className="credito-diferencia" style={{
                                        marginTop: '0.5rem',
                                        fontSize: '0.875rem',
                                        color: parseFloat(nuevoCredito) > clienteCredito.deudaActual ? '#dc2626' : '#16a34a'
                                    }}>
                                        Diferencia: {parseFloat(nuevoCredito) >= clienteCredito.deudaActual ? '+' : ''}
                                        S/ {(parseFloat(nuevoCredito || '0') - clienteCredito.deudaActual).toFixed(2)}
                                    </div>
                                )}
                            </div>
                            <div className="form-group-modal">
                                <label>Motivo del Ajuste *</label>
                                <input
                                    type="text"
                                    required
                                    value={motivoAjuste}
                                    onChange={e => setMotivoAjuste(e.target.value)}
                                    placeholder="Ej: Corrección de monto, acuerdo con cliente, etc."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setMostrarModalCredito(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save" style={{ background: '#f59e0b' }}>Actualizar Crédito</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Historial de Compras */}
            {mostrarModalHistorial && clienteHistorial && (
                <div className="modal-overlay" onClick={() => setMostrarModalHistorial(false)}>
                    <div className="modal-historial" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-historial-header">
                            <h3>📋 Historial de Compras</h3>
                            <button className="btn-cerrar-modal" onClick={() => setMostrarModalHistorial(false)}>×</button>
                        </div>

                        <div className="cliente-info-historial">
                            <div className="cliente-avatar-grande">
                                {clienteHistorial.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="cliente-datos-historial">
                                <h4>{clienteHistorial.nombre}</h4>
                                <p>{clienteHistorial.telefono || 'Sin teléfono'}</p>
                                <div className={`deuda-badge ${clienteHistorial.deudaActual > 0 ? 'con-deuda' : 'sin-deuda'}`}>
                                    Deuda: S/ {clienteHistorial.deudaActual.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="historial-lista">
                            {obtenerHistorialCliente(clienteHistorial.id).length === 0 ? (
                                <div className="sin-historial">
                                    <p>📦 Este cliente no tiene compras registradas</p>
                                </div>
                            ) : (
                                obtenerHistorialCliente(clienteHistorial.id).map(venta => (
                                    <div key={venta.id} className={`historial-item ${venta.anulada ? 'anulada' : ''}`}>
                                        <div className="historial-fecha">
                                            <span className="fecha">{formatearFecha(venta.fecha)}</span>
                                            {venta.anulada && <span className="badge-anulada">ANULADA</span>}
                                        </div>
                                        <div className="historial-productos">
                                            {venta.items.length > 0 ? (
                                                <ul>
                                                    {venta.items.map((item, idx) => (
                                                        <li key={idx}>
                                                            <span className="producto-nombre">{item.producto.nombre}</span>
                                                            <span className="producto-cantidad">x{item.cantidad}</span>
                                                            <span className="producto-precio">
                                                                S/ {((item.subcategoriaSeleccionada && item.producto.preciosPorSubcategoria?.[item.subcategoriaSeleccionada]) || item.producto.precio * item.cantidad).toFixed(2)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="pago-deuda-nota">💸 Pago de deuda</p>
                                            )}
                                        </div>
                                        <div className="historial-total">
                                            <span className="metodo-pago">
                                                {venta.metodosPago.map(m =>
                                                    m.tipo === 'efectivo' ? '💵' :
                                                        m.tipo === 'yape' ? '📱' :
                                                            m.tipo === 'tarjeta' ? '💳' : '📝'
                                                ).join(' ')}
                                            </span>
                                            <span className="total-monto">S/ {venta.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="historial-resumen">
                            <div className="resumen-item">
                                <span>Total Transacciones:</span>
                                <strong>{obtenerHistorialCliente(clienteHistorial.id).length}</strong>
                            </div>
                            <div className="resumen-item">
                                <span>Total Gastado:</span>
                                <strong>
                                    S/ {obtenerHistorialCliente(clienteHistorial.id)
                                        .filter(v => !v.anulada && v.items.length > 0)
                                        .reduce((sum, v) => sum + v.total, 0)
                                        .toFixed(2)}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
