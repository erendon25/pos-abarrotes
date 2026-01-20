import { useState } from 'react'
import { Usuario } from '../types'
import './Usuarios.css'

interface UsuariosProps {
    usuarios: Usuario[]
    setUsuarios: (usuarios: Usuario[]) => void
}

const PERMISOS_DEFAULT = {
    ventas: false,
    reportes: false,
    catalogo: false,
    categorias: false,
    ingresos: false,
    usuarios: false,
    configuracion: false
}

export default function Usuarios({ usuarios, setUsuarios }: UsuariosProps) {
    const [mostrarModal, setMostrarModal] = useState(false)
    const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null)

    // Form State
    const [nombre, setNombre] = useState('')
    const [usuarioLogin, setUsuarioLogin] = useState('')
    const [password, setPassword] = useState('')
    const [rol, setRol] = useState<'admin' | 'venta'>('venta')
    const [permisos, setPermisos] = useState(PERMISOS_DEFAULT)

    const abrirModal = (usuario?: Usuario) => {
        if (usuario) {
            setUsuarioEditar(usuario)
            setNombre(usuario.nombre)
            setUsuarioLogin(usuario.usuario)
            setPassword(usuario.password || '')
            setRol(usuario.rol)
            setPermisos(usuario.permisos || PERMISOS_DEFAULT)
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

        // Lógica clave automática si es venta (según requerimiento)
        let finalPassword = password
        if (rol === 'venta' && !password && !usuarioEditar) {
            finalPassword = 'venta'
        } else if (!password && usuarioEditar) {
            finalPassword = usuarioEditar.password || 'venta'
        }

        const nuevoUsuario: Usuario = {
            id: usuarioEditar ? usuarioEditar.id : Date.now().toString(),
            nombre,
            usuario: usuarioLogin,
            password: finalPassword,
            rol,
            permisos: rol === 'admin' ?
                { ventas: true, reportes: true, catalogo: true, categorias: true, ingresos: true, usuarios: true, configuracion: true }
                : permisos
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

    return (
        <div className="usuarios-container">
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
                                        {u.rol === 'admin' ? 'Administrador' : 'Vendedor'}
                                    </span>
                                </td>
                                <td>
                                    <span className="badge-activo">Activo</span>
                                </td>
                                <td>
                                    <div className="acciones-user">
                                        <button onClick={() => abrirModal(u)} className="btn-icon-user edit">✏️</button>
                                        {u.usuario !== 'admin' && (
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
                    <div className="modal-content">
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
                                    <label>Nivel de Acceso</label>
                                    <select value={rol} onChange={e => setRol(e.target.value as any)}>
                                        <option value="venta">Vendedor / Personalizado</option>
                                        <option value="admin">Administrador (Acceso Total)</option>
                                    </select>
                                </div>
                                <div className="form-group-modal">
                                    <label>Contraseña {usuarioEditar && '(Dejar vacío para mantener)'}</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={!usuarioEditar && rol === 'venta' ? 'Por defecto: venta' : ''}
                                    />
                                </div>
                            </div>

                            {rol !== 'admin' && (
                                <div className="permisos-section">
                                    <h4>🛡️ Permisos por Módulo</h4>
                                    <div className="permisos-grid">
                                        {Object.keys(PERMISOS_DEFAULT).map(p => (
                                            <label key={p} className="permiso-item">
                                                <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                                                <div className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={permisos[p as keyof typeof permisos]}
                                                        onChange={e => setPermisos({ ...permisos, [p]: e.target.checked })}
                                                    />
                                                    <span className="slider round"></span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

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
