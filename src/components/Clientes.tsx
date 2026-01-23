import { useState } from 'react'
import { Cliente, MetodoPago, Usuario } from '../types'
import './Clientes.css'

interface ClientesProps {
    clientes: Cliente[]
    setClientes: (clientes: Cliente[]) => void
    onRegistrarPago: (clienteId: string, monto: number, metodoPago: MetodoPago['tipo']) => void
    usuario: Usuario
}

export default function Clientes({ clientes, setClientes, onRegistrarPago, usuario }: ClientesProps) {
    const [mostrarModal, setMostrarModal] = useState(false)
    const [mostrarModalPago, setMostrarModalPago] = useState(false)

    // Edit/Create State
    const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null)
    const [nombre, setNombre] = useState('')
    const [telefono, setTelefono] = useState('')

    // Payment State
    const [clientePago, setClientePago] = useState<Cliente | null>(null)
    const [montoPago, setMontoPago] = useState('')
    const [metodoPago, setMetodoPago] = useState<MetodoPago['tipo']>('efectivo')

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

    return (
        <div className="clientes-container">
            <div className="clientes-header">
                <div>
                    <h2>Gestión de Clientes y Cuentas por Cobrar</h2>
                    <p>Administra clientes y registra pagos de deuda.</p>
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
                                    <td>{c.nombre}</td>
                                    <td>{c.telefono || '-'}</td>
                                    <td>
                                        <span className={c.deudaActual > 0 ? 'saldo-negativo' : 'saldo-positivo'}>
                                            S/ {c.deudaActual.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="acciones-cliente">
                                            {c.deudaActual > 0 && (
                                                <button className="btn-pagar-deuda" onClick={() => abrirModalPago(c)}>
                                                    💸 Pagar Deuda
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
        </div>
    )
}
