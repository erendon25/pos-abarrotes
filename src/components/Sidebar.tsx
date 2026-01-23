import { Usuario } from '../types'
import './Sidebar.css'

interface SidebarProps {
    vistaActual: string
    cambiarVista: (vista: any) => void
    usuario: Usuario
    cerrarSesion: () => void
}

export default function Sidebar({ vistaActual, cambiarVista, usuario, cerrarSesion }: SidebarProps) {

    const tienePermiso = (permiso: string) => {
        if (usuario.rol === 'admin') return true
        return usuario.permisos?.[permiso as keyof typeof usuario.permisos] || false
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                </div>
                <h1>{localStorage.getItem('pos_empresa') ? JSON.parse(localStorage.getItem('pos_empresa')!).nombre : 'Sistema POS'}</h1>
            </div>

            <nav className="sidebar-nav">
                {tienePermiso('ventas') && (
                    <button
                        className={`nav-item ${vistaActual === 'venta' ? 'active' : ''}`}
                        onClick={() => cambiarVista('venta')}
                    >
                        <span className="icon">🛒</span>
                        Venta
                    </button>
                )}

                {tienePermiso('ventas') && (
                    <button
                        className={`nav-item ${vistaActual === 'clientes' ? 'active' : ''}`}
                        onClick={() => cambiarVista('clientes')}
                    >
                        <span className="icon">👥</span>
                        Clientes / Créditos
                    </button>
                )}

                {tienePermiso('reportes') && (
                    <button
                        className={`nav-item ${vistaActual === 'reportes' ? 'active' : ''}`}
                        onClick={() => cambiarVista('reportes')}
                    >
                        <span className="icon">📈</span>
                        Reporte de Ventas
                    </button>
                )}

                {tienePermiso('catalogo') && (
                    <button
                        className={`nav-item ${vistaActual === 'catalogo' ? 'active' : ''}`}
                        onClick={() => cambiarVista('catalogo')}
                    >
                        <span className="icon">📦</span>
                        Catálogo Productos
                    </button>
                )}

                {tienePermiso('categorias') && (
                    <button
                        className={`nav-item ${vistaActual === 'categorias' ? 'active' : ''}`}
                        onClick={() => cambiarVista('categorias')}
                    >
                        <span className="icon">🏷️</span>
                        Categorías
                    </button>
                )}

                {tienePermiso('inventario') && (
                    <button
                        className={`nav-item ${vistaActual === 'inventario' ? 'active' : ''}`}
                        onClick={() => cambiarVista('inventario')}
                    >
                        <span className="icon">📋</span>
                        Inventario
                    </button>
                )}

                {tienePermiso('ingresos') && (
                    <button
                        className={`nav-item ${vistaActual === 'ingresoMercaderia' ? 'active' : ''}`}
                        onClick={() => cambiarVista('ingresoMercaderia')}
                    >
                        <span className="icon">🚚</span>
                        Ingreso Mercadería
                    </button>
                )}

                {tienePermiso('usuarios') && (
                    <button
                        className={`nav-item ${vistaActual === 'usuarios' ? 'active' : ''}`}
                        onClick={() => cambiarVista('usuarios')}
                    >
                        <span className="icon">👥</span>
                        Usuarios y Accesos
                    </button>
                )}

                {tienePermiso('configuracion') && (
                    <button
                        className={`nav-item ${vistaActual === 'configuracion' ? 'active' : ''}`}
                        onClick={() => cambiarVista('configuracion')}
                    >
                        <span className="icon">⚙️</span>
                        Configuración
                    </button>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {usuario.usuario.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{usuario.nombre}</span>
                        <span className="user-role">{usuario.rol === 'admin' ? 'Administrador' : 'Vendedor'}</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={cerrarSesion} title="Cerrar Sesión">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        </aside>
    )
}
