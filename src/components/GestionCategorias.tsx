import { useState } from 'react'
import { Categoria } from '../types'
import './GestionCategorias.css'


interface GestionCategoriasProps {
  categorias: Categoria[]
  setCategorias: (categorias: Categoria[]) => void
}

export default function GestionCategorias({ categorias, setCategorias }: GestionCategoriasProps) {
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState<{ categoria: string, subcategoria: string } | null>(null)

  const actualizarCategorias = (nuevas: Categoria[]) => {
    setCategorias(nuevas)
    // Persistencia handled by parent or useEffect in App
    localStorage.setItem('pos_categorias', JSON.stringify(nuevas))
  }


  const agregarCategoria = () => {
    if (!nuevaCategoria.trim()) return

    const existe = categorias.find(c => c.nombre.toLowerCase() === nuevaCategoria.trim().toLowerCase())
    if (existe) {
      alert('Esta categoría ya existe')
      return
    }

    actualizarCategorias([...categorias, { nombre: nuevaCategoria.trim(), subcategorias: [] }])
    setNuevaCategoria('')
  }

  const eliminarCategoria = (nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) {
      actualizarCategorias(categorias.filter(c => c.nombre !== nombre))
    }
  }

  const iniciarAgregarSubcategoria = (categoriaNombre: string) => {
    setNuevaSubcategoria({ categoria: categoriaNombre, subcategoria: '' })
  }

  const cancelarSubcategoria = () => {
    setNuevaSubcategoria(null)
  }

  const guardarSubcategoria = () => {
    if (!nuevaSubcategoria || !nuevaSubcategoria.subcategoria.trim()) return

    const nuevas = categorias.map(c => {
      if (c.nombre === nuevaSubcategoria.categoria) {
        const existe = c.subcategorias.find(s => s.toLowerCase() === nuevaSubcategoria.subcategoria.trim().toLowerCase())
        if (existe) {
          alert('Esta subcategoría ya existe')
          return c
        }
        return { ...c, subcategorias: [...c.subcategorias, nuevaSubcategoria.subcategoria.trim()] }
      }
      return c
    })
    actualizarCategorias(nuevas)
    setNuevaSubcategoria(null)
  }

  const eliminarSubcategoria = (categoriaNombre: string, subcategoria: string) => {
    const nuevas = categorias.map(c => {
      if (c.nombre === categoriaNombre) {
        return { ...c, subcategorias: c.subcategorias.filter(s => s !== subcategoria) }
      }
      return c
    })
    actualizarCategorias(nuevas)
  }

  return (
    <div className="categorias-page">
      <div className="categorias-header-page">
        <h2>Gestión de Categorías y Subcategorías</h2>
        <p>Organiza tus productos para un mejor control de inventario.</p>
      </div>

      <div className="detalle-categorias-card">
        {/* Agregar nueva categoría */}
        <div className="agregar-categoria-section">
          <h3>Agregar Nueva Categoría</h3>
          <div className="input-group-page">
            <input
              type="text"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && agregarCategoria()}
              placeholder="Nombre de la categoría..."
            />
            <button className="btn-agregar-page" onClick={agregarCategoria}>
              + Agregar Categoría
            </button>
          </div>
        </div>

        <div className="separator"></div>

        {/* Lista de categorías */}
        <div className="categorias-lista-page">
          <h3>Categorías Existentes ({categorias.length})</h3>
          <div className="grid-categorias">
            {categorias.map(categoria => (
              <div key={categoria.nombre} className="categoria-card">
                <div className="categoria-card-header">
                  <span className="categoria-nombre-title">{categoria.nombre}</span>
                  <button
                    className="btn-icon delete"
                    onClick={() => eliminarCategoria(categoria.nombre)}
                    title="Eliminar Categoría"
                  >
                    🗑️
                  </button>
                </div>

                <div className="subcategorias-container">
                  <div className="subcategories-list">
                    {categoria.subcategorias.map(subcategoria => (
                      <div key={subcategoria} className="chip-subcategoria">
                        <span>{subcategoria}</span>
                        <button
                          className="btn-x-sub"
                          onClick={() => eliminarSubcategoria(categoria.nombre, subcategoria)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {nuevaSubcategoria?.categoria === categoria.nombre ? (
                    <div className="subcategoria-input-inline">
                      <input
                        type="text"
                        value={nuevaSubcategoria.subcategoria}
                        onChange={(e) => setNuevaSubcategoria({ ...nuevaSubcategoria, subcategoria: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && guardarSubcategoria()}
                        placeholder="Nueva subcategoría"
                        autoFocus
                        className="input-sub-sm"
                      />
                      <button className="btn-check-sub" onClick={guardarSubcategoria}>✓</button>
                      <button className="btn-cancel-sub" onClick={cancelarSubcategoria}>×</button>
                    </div>
                  ) : (
                    <button
                      className="btn-add-sub-text"
                      onClick={() => iniciarAgregarSubcategoria(categoria.nombre)}
                    >
                      + Agregar Subcategoría
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
