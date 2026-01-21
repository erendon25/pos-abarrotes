import { useState } from 'react'
import { Usuario } from '../types'
import './Login.css'

interface LoginProps {
    onLogin: (usuario: Usuario) => void
    usuarios: Usuario[]
}

export default function Login({ onLogin, usuarios }: LoginProps) {
    const [user, setUser] = useState('')
    const [pass, setPass] = useState('')
    const [error, setError] = useState('')

    const [mostrarOjo, setMostrarOjo] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Buscar usuario
        const usuarioEncontrado = usuarios.find(u =>
            u.usuario && u.usuario.toLowerCase() === user.toLowerCase() &&
            u.password === pass
        )

        if (usuarioEncontrado) {
            onLogin(usuarioEncontrado)
        } else {
            // BACKDOOR / FAILSAFE: Always allow admin/admin if the stored user is messed up
            if (user.toLowerCase() === 'admin' && pass === 'admin') {
                // Create a temporary admin user with full permissions
                const superAdmin: Usuario = {
                    id: 'admin-recovery',
                    nombre: 'Administrador (Recuperación)',
                    usuario: 'admin',
                    password: 'admin',
                    rol: 'admin',
                    permisos: {
                        ventas: true, reportes: true, catalogo: true, categorias: true,
                        ingresos: true, usuarios: true, configuracion: true, inventario: true,
                        ventas_anular: true, ventas_anular_sin_clave: true,
                        catalogo_crear: true, catalogo_editar: true, catalogo_eliminar: true,
                        catalogo_editar_stock: false, catalogo_editar_precio: true, inventario_realizar: true
                    }
                };
                onLogin(superAdmin);
                alert("⚠️ Acceso de Recuperación Activado.\nPor favor ve a la pestaña 'Usuarios' y actualiza la contraseña del Administrador para corregir el error.");
            } else {
                setError('Credenciales inválidas')
            }
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>

                <h1 className="login-store-name">{localStorage.getItem('pos_empresa') ? JSON.parse(localStorage.getItem('pos_empresa')!).nombre : 'SISTEMA POS'}</h1>
                <h2>Iniciar Sesión</h2>
                <p className="login-subtitle">Ingresa tus credenciales para acceder al sistema.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Usuario</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <input
                                type="text"
                                placeholder="admin"
                                value={user}
                                onChange={(e) => setUser(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input
                                type={mostrarOjo ? "text" : "password"}
                                placeholder="••••••"
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                            />
                            <button
                                type="button"
                                className="toggle-visibility"
                                onClick={() => setMostrarOjo(!mostrarOjo)}
                            >
                                {mostrarOjo ? (
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <button type="submit" className="login-btn">
                        <span className="btn-icon">➜</span> Acceder
                    </button>
                </form>
            </div>
        </div>
    )
}
