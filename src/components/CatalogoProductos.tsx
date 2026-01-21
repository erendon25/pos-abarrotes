import { useState } from 'react'
import { Producto, Categoria, Usuario } from '../types'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import './CatalogoProductos.css'

interface CatalogoProductosProps {
    productos: Producto[]
    setProductos: (productos: Producto[]) => void
    categorias: Categoria[]
    usuario: Usuario
}

export default function CatalogoProductos({ productos, setProductos, categorias, usuario }: CatalogoProductosProps) {
    // ... (rest of state logic usually) ...
    const [busqueda, setBusqueda] = useState('')
    const [mostrarModal, setMostrarModal] = useState(false)
    const [productoEditar, setProductoEditar] = useState<Producto | null>(null)

    // Form State
    const [nombre, setNombre] = useState('')
    const [codigoBarras, setCodigoBarras] = useState('')
    const [precio, setPrecio] = useState('')
    const [costo, setCosto] = useState('')
    const [categoria, setCategoria] = useState('')
    const [stock, setStock] = useState('')
    // Subcategory Prices
    const [preciosSubcat, setPreciosSubcat] = useState<Record<string, string>>({})

    const abrirModal = (producto?: Producto) => {
        if (producto) {
            setProductoEditar(producto)
            setNombre(producto.nombre)
            setCodigoBarras(producto.codigoBarras || '')
            setPrecio(producto.precio.toString())
            setCosto(producto.costo?.toString() || '')
            setCategoria(producto.categoria)
            setStock(producto.stock.toString())

            // Convert numbers to strings for inputs
            const preciosStr: Record<string, string> = {}
            if (producto.preciosPorSubcategoria) {
                Object.entries(producto.preciosPorSubcategoria).forEach(([key, val]) => {
                    preciosStr[key] = val.toString()
                })
            }
            setPreciosSubcat(preciosStr)

        } else {
            setProductoEditar(null)
            setNombre('')
            setCodigoBarras('')
            setPrecio('')
            setCosto('')
            setCategoria('')
            setStock('')
            setPreciosSubcat({})
        }
        setMostrarModal(true)
    }

    const guardarProducto = async (e: React.FormEvent) => {
        e.preventDefault()

        // Process subcategory prices
        const preciosFinales: Record<string, number> = {}
        Object.entries(preciosSubcat).forEach(([key, val]) => {
            const num = parseFloat(val)
            if (!isNaN(num) && num > 0) {
                preciosFinales[key] = num
            }
        })

        const nuevoProducto: Producto = {
            id: productoEditar ? productoEditar.id : Date.now().toString(),
            nombre,
            codigoBarras,
            // Keep original values if edit is not allowed, or use parsed values
            precio: usuario.permisos.catalogo_editar_precio ? (parseFloat(precio) || 0) : (productoEditar?.precio || 0),
            costo: usuario.permisos.catalogo_editar_precio ? (parseFloat(costo) || 0) : (productoEditar?.costo || 0),
            categoria: categoria || 'General',
            // Only update stock if allowed. Else keep original (or 0 for new)
            stock: usuario.permisos.catalogo_editar_stock ? (parseInt(stock) || 0) : (productoEditar?.stock || 0),
            activo: true,
            sincronizado: true, // Asumimos sincronizado al guardar directo
            // Logic for subcategory prices: Only update if permission allowed. Else keep original.
            preciosPorSubcategoria: usuario.permisos.catalogo_editar_precio
                ? (Object.keys(preciosFinales).length > 0 ? preciosFinales : undefined)
                : (productoEditar?.preciosPorSubcategoria)
        }

        // ... (Update Logic) ...
        // Optimistic update
        let nuevosProductos;
        if (productoEditar) {
            nuevosProductos = productos.map(p => p.id === productoEditar.id ? nuevoProducto : p)
        } else {
            nuevosProductos = [...productos, nuevoProducto]
        }
        setProductos(nuevosProductos)
        localStorage.setItem('pos_productos', JSON.stringify(nuevosProductos))

        // Save to Firebase
        try {
            await setDoc(doc(db, "productos", nuevoProducto.id), nuevoProducto)
        } catch (error) {
            console.error("Error saving to Firebase:", error)
            alert("Error guardando en la nube. Se guardó localmente.")
        }

        setMostrarModal(false)
    }

    const eliminarProducto = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return

        const nuevosProductos = productos.filter(p => p.id !== id)
        setProductos(nuevosProductos)
        localStorage.setItem('pos_productos', JSON.stringify(nuevosProductos))

        try {
            await deleteDoc(doc(db, "productos", id))
        } catch (error) {
            console.error("Error deleting from Firebase:", error)
        }
    }

    // ... (Filter Logic) ...
    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigoBarras?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busqueda.toLowerCase())
    )

    // ... (Categoria object) ...
    const categoriaObj = categorias.find(c => c.nombre === categoria)

    // Per-permission Logic
    const allowEditStock = usuario.permisos.catalogo_editar_stock
    const allowEditPrice = usuario.permisos.catalogo_editar_precio

    return (
        <div className="catalogo-container">
            <div className="catalogo-header">
                <div>
                    <h2>Catálogo de Productos</h2>
                    <p>Administra los items disponibles para venta y compra.</p>
                </div>
                {/* Check creation permission */}
                <div className="header-actions">
                    <div className="search-box">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    {usuario.permisos.catalogo_crear && (
                        <button className="btn-nuevo-prod" onClick={() => abrirModal()}>
                            + Nuevo
                        </button>
                    )}
                </div>
            </div>

            <div className="tabla-catalogo-card">
                <table className="tabla-catalogo">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Stock</th>
                            <th>Unidad</th>
                            <th>Costo</th>
                            <th>Precio</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosFiltrados.map(p => (
                            <tr key={p.id}>
                                <td className="font-mono text-sm">{p.codigoBarras || '-'}</td>
                                <td className="font-bold">{p.nombre}</td>
                                <td>
                                    <span className="badge-cat">{p.categoria}</span>
                                </td>
                                <td className={p.stock <= 5 ? 'text-red-500 font-bold' : ''}>{p.stock}</td>
                                <td className="text-sm text-gray">{p.presentacion || 'und'}</td>
                                <td>S/ {(p.costo || 0).toFixed(2)}</td>
                                <td className="font-bold">S/ {p.precio.toFixed(2)}</td>
                                <td>
                                    <div className="acciones-row">
                                        {usuario.permisos.catalogo_editar && (
                                            <button className="btn-icon edit" title="Editar" onClick={() => abrirModal(p)}>✏️</button>
                                        )}
                                        {usuario.permisos.catalogo_eliminar && (
                                            <button className="btn-icon delete" title="Eliminar" onClick={() => eliminarProducto(p.id)}>🗑️</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {productosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={9} className="text-center py-4">No se encontraron productos</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{productoEditar ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={() => setMostrarModal(false)}>×</button>
                        </div>
                        <form onSubmit={guardarProducto} className="modal-body-scroll">
                            <div className="form-row">
                                <div className="form-group-modal">
                                    <label>Nombre del Producto</label>
                                    <input required value={nombre} onChange={e => setNombre(e.target.value)} />
                                </div>
                                <div className="form-group-modal">
                                    <label>Código de Barras</label>
                                    <input value={codigoBarras} onChange={e => setCodigoBarras(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group-modal">
                                    <label>Precio Venta (Base)</label>
                                    <input type="number" step="0.01" required value={precio} onChange={e => setPrecio(e.target.value)} disabled={!allowEditPrice} />
                                </div>
                                <div className="form-group-modal">
                                    <label>Costo Compra</label>
                                    <input type="number" step="0.01" value={costo} onChange={e => setCosto(e.target.value)} disabled={!allowEditPrice} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group-modal">
                                    <label>Categoría</label>
                                    <select
                                        value={categoria}
                                        onChange={e => {
                                            setCategoria(e.target.value)
                                            setPreciosSubcat({}) // Reset subcat prices on category change
                                        }}
                                        required
                                        className="input-select"
                                    >
                                        <option value="">Seleccione Categoría</option>
                                        {categorias.map(c => (
                                            <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group-modal">
                                    <label>Stock Inicial</label>
                                    <input
                                        type="number"
                                        value={stock}
                                        onChange={e => setStock(e.target.value)}
                                        disabled={!allowEditStock}
                                        title={!allowEditStock ? "Solo modificable en Inventario (o permiso de Almacén)" : ""}
                                    />
                                    {!allowEditStock && <small className="text-xs text-red-500">Solo editable en Inventario</small>}
                                </div>
                            </div>

                            {/* Prices per Subcategory */}
                            {categoriaObj && categoriaObj.subcategorias.length > 0 && (
                                <div className="subcategorias-precios-section">
                                    <h4>Precios por Subcategoría (Opcional)</h4>
                                    <p className="text-sm text-gray mb-2">Si se deja vacío, se usará el precio base.</p>
                                    <div className="grid-2-col">
                                        {categoriaObj.subcategorias.map(sub => (
                                            <div key={sub} className="form-group-modal">
                                                <label>Precio {sub}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder={`Base: ${precio}`}
                                                    value={preciosSubcat[sub] || ''}
                                                    onChange={e => setPreciosSubcat({ ...preciosSubcat, [sub]: e.target.value })}
                                                    disabled={!allowEditPrice}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" onClick={() => setMostrarModal(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save">Guardar Producto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
