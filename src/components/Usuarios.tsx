import { useState } from 'react'
import { Usuario } from '../types'
import './Usuarios.css'

interface UsuariosProps {
    usuarios: Usuario[]
    setUsuarios: (usuarios: Usuario[]) => void
}

// ... imports

const PERMISOS_DEFAULT = {
    // Módulos
    ventas: true,
    reportes: false,
    catalogo: true,
    categorias: false,
    ingresos: false,
    usuarios: false,
    configuracion: false,
    inventario: true,

    // Acciones
    ventas_anular: false,
    ventas_anular_sin_clave: false,
    catalogo_crear: false,
    catalogo_editar: false,
    catalogo_eliminar: false,
    catalogo_editar_stock: false,
    catalogo_editar_precio: false,
    inventario_realizar: true
}

export default function Usuarios({ usuarios, setUsuarios }: UsuariosProps) {
    const [mostrarModal, setMostrarModal] = useState(false)
    const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null)

    // Form State
    const [nombre, setNombre] = useState('')
    const [usuarioLogin, setUsuarioLogin] = useState('')
    const [password, setPassword] = useState('')
    const [rol, setRol] = useState<'admin' | 'venta' | 'almacen'>('venta')
    const [permisos, setPermisos] = useState(PERMISOS_DEFAULT)

    const abrirModal = (usuario?: Usuario) => {
        if (usuario) {
            setUsuarioEditar(usuario)
            setNombre(usuario.nombre)
            setUsuarioLogin(usuario.usuario)
            setPassword(usuario.password || '')
            setRol(usuario.rol)
            // Ensure we merge with defaults to catch new keys
            setPermisos({ ...PERMISOS_DEFAULT, ...(usuario.permisos || {}) })
        } else {
            setUsuarioEditar(null)
            setNombre('')
            setUsuarioLogin('')
            setPassword('')
            setRol('venta')
            setPermisos(PERMISOS_DEFAULT)
        }
        setMostrarModal(true)
    }

    const guardarUsuario = (e: React.FormEvent) => {
        e.preventDefault()

        // Lógica clave automática
        let finalPassword = password
        if (rol === 'venta' && !password && !usuarioEditar) {
            finalPassword = 'venta'
        } else if (rol === 'almacen' && !password && !usuarioEditar) {
            finalPassword = 'almacen'
        } else if (!password && usuarioEditar) {
            finalPassword = usuarioEditar.password || 'venta'
        }

        // NO hardcodear permisos por rol 'admin'. El usuario quiere editarlos.
        // Pero al cambiar de rol en el select, deberíamos quizás pre-llenar defaults. (Lógica en el onChange del select)

        const nuevoUsuario: Usuario = {
            id: usuarioEditar ? usuarioEditar.id : Date.now().toString(),
            nombre,
            usuario: usuarioLogin,
            password: finalPassword,
            rol,
            permisos: permisos
        }

        if (usuarioEditar) {
            setUsuarios(usuarios.map(u => u.id === usuarioEditar.id ? nuevoUsuario : u))
        } else {
            setUsuarios([...usuarios, nuevoUsuario])
        }

        const usuariosActualizados = usuarioEditar
            ? usuarios.map(u => u.id === usuarioEditar.id ? nuevoUsuario : u)
            : [...usuarios, nuevoUsuario]

        // Persistir
        localStorage.setItem('pos_usuarios', JSON.stringify(usuariosActualizados))
        setMostrarModal(false)
    }

    const eliminarUsuario = (id: string) => {
        if (confirm('¿Seguro que desea eliminar este usuario?')) {
            const nuevosUsuarios = usuarios.filter(u => u.id !== id)
            setUsuarios(nuevosUsuarios)
            localStorage.setItem('pos_usuarios', JSON.stringify(nuevosUsuarios))
        }
    }

    // Helper to set defaults based on role selection
    const handleRolChange = (newRol: 'admin' | 'venta' | 'almacen') => {
        setRol(newRol)
        if (newRol === 'admin') {
            setPermisos({
                ventas: true, reportes: true, catalogo: true, categorias: true, ingresos: true, usuarios: true, configuracion: true, inventario: true,
                ventas_anular: true, ventas_anular_sin_clave: true,
                catalogo_crear: true, catalogo_editar: true, catalogo_eliminar: true,
                catalogo_editar_stock: false, catalogo_editar_precio: true,
                inventario_realizar: true
            })
        } else if (newRol === 'almacen') {
            setPermisos({
                ventas: false, reportes: false, catalogo: true, categorias: true, ingresos: true, usuarios: false, configuracion: false, inventario: true,
                ventas_anular: false, ventas_anular_sin_clave: false,
                catalogo_crear: true, catalogo_editar: true, catalogo_eliminar: false,
                catalogo_editar_stock: true, catalogo_editar_precio: true,
                inventario_realizar: true
            })
        } else {
            // Venta default
            setPermisos(PERMISOS_DEFAULT)
        }
    }

    const renderSwitch = (label: string, key: keyof typeof permisos) => (
        <label key={key} className="permiso-item">
            <span>{label}</span>
            <div className="switch">
                <input
                    type="checkbox"
                    checked={permisos[key]}
                    onChange={e => setPermisos({ ...permisos, [key]: e.target.checked })}
                />
                <span className="slider round"></span>
            </div>
        </label>
    )

    return (
        <div className="usuarios-container">
            {/* Header ... */}
            <div className="usuarios-header">
                <div>
                    <h2>Usuarios y Accesos</h2>
                    <p>Gestiona el personal y sus permisos de acceso.</p>
                </div>
                <button className="btn-nuevo" onClick={() => abrirModal()}>
                    + Nuevo Usuario
                </button>
            </div>

            <div className="tabla-usuarios-card">
                <table className="tabla-usuarios">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Nombre Completo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(u => (
                            <tr key={u.id}>
                                <td className="font-bold">{u.usuario}</td>
                                <td>{u.nombre}</td>
                                <td>
                                    <span className={`badge-rol ${u.rol}`}>
                                        {u.rol === 'admin' ? 'Administrador' : u.rol === 'almacen' ? 'Almacén' : 'Vendedor'}
                                    </span>
                                </td>
                                <td>
                                    <span className="badge-activo">Activo</span>
                                </td>
                                <td>
                                    <div className="acciones-user">
                                        <button onClick={() => abrirModal(u)} className="btn-icon-user edit">✏️</button>
                                        {u.usuario !== 'admin' && ( // Allow deleting others
                                            <button onClick={() => eliminarUsuario(u.id)} className="btn-icon-user delete">🗑️</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3>{usuarioEditar ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                            <button onClick={() => setMostrarModal(false)}>×</button>
                        </div>

                        <form onSubmit={guardarUsuario} className="modal-body-scroll">
                            <div className="form-row">
                                <div className="form-group-modal">
                                    <label>Usuario (Login)</label>
                                    <input
                                        required
                                        value={usuarioLogin}
                                        onChange={e => setUsuarioLogin(e.target.value)}
                                        disabled={usuarioEditar?.usuario === 'admin'}
                                    />
                                </div>
                                <div className="form-group-modal">
                                    <label>Nombre Completo</label>
                                    <input required value={nombre} onChange={e => setNombre(e.target.value)} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group-modal">
                                    <label>Rol (Define permisos base)</label>
                                    <select value={rol} onChange={e => handleRolChange(e.target.value as any)}>
                                        <option value="venta">Vendedor</option>
                                        <option value="almacen">Almacenero</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="form-group-modal">
                                    <label>Contraseña {usuarioEditar && '(Dejar vacío para mantener)'}</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={!usuarioEditar && rol !== 'admin' ? `Por defecto: ${rol}` : ''}
                                    />
                                </div>
                            </div>

                            <div className="permisos-section">
                                <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>🛡️ Accesos a Módulos</h4>
                                <div className="permisos-grid">
                                    {renderSwitch("Ventas (POS)", "ventas")}
                                    {renderSwitch("Reportes", "reportes")}
                                    {renderSwitch("Catálogo", "catalogo")}
                                    {renderSwitch("Inventario", "inventario")}
                                    {renderSwitch("Ingresos (Compras)", "ingresos")}
                                    {renderSwitch("Categorías", "categorias")}
                                    {renderSwitch("Usuarios", "usuarios")}
                                    {renderSwitch("Configuración", "configuracion")}
                                </div>

                                <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px', marginTop: '15px' }}>🔧 Permisos Específicos</h4>
                                <div className="permisos-grid">
                                    {renderSwitch("Anular Ventas", "ventas_anular")}
                                    {renderSwitch("Anular SIN Clave Admin", "ventas_anular_sin_clave")}

                                    {renderSwitch("Crear Productos", "catalogo_crear")}
                                    {renderSwitch("Editar Productos", "catalogo_editar")}
                                    {renderSwitch("Eliminar Productos", "catalogo_eliminar")}

                                    {renderSwitch("Editar PRECIO en Catálogo", "catalogo_editar_precio")}
                                    {renderSwitch("Editar STOCK en Catálogo", "catalogo_editar_stock")}

                                    {renderSwitch("Realizar Ajustes Inventario", "inventario_realizar")}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setMostrarModal(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save">Guardar Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
