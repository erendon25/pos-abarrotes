# Instrucciones para subir el proyecto a GitHub

## Opción 1: Usando GitHub Desktop (Recomendado - Más fácil)

1. **Instala GitHub Desktop** (si no lo tienes):
   - Descarga desde: https://desktop.github.com/
   - Instala y configura tu cuenta de GitHub

2. **Crea el repositorio en GitHub Desktop**:
   - Abre GitHub Desktop
   - Click en "File" > "Add Local Repository"
   - Selecciona la carpeta: `C:\Users\jenni\pos-abarrotes`
   - Si te pregunta si quieres crear un repositorio, selecciona "Create a repository"

3. **Haz commit de los archivos**:
   - En GitHub Desktop verás todos los archivos nuevos
   - Escribe un mensaje de commit (ej: "Initial commit - POS Abarrotes")
   - Click en "Commit to main"

4. **Publica el repositorio**:
   - Click en "Publish repository"
   - Elige un nombre para el repositorio (ej: "pos-abarrotes")
   - Marca "Keep this code private" si quieres que sea privado
   - Click en "Publish repository"

## Opción 2: Usando Git desde la línea de comandos

### Paso 1: Instalar Git (si no lo tienes)

1. Descarga Git desde: https://git-scm.com/download/win
2. Instala Git con las opciones por defecto
3. Reinicia la terminal después de instalar

### Paso 2: Configurar Git (solo la primera vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### Paso 3: Inicializar el repositorio

Abre PowerShell o CMD en la carpeta del proyecto y ejecuta:

```bash
cd C:\Users\jenni\pos-abarrotes
git init
git add .
git commit -m "Initial commit - POS Abarrotes"
```

### Paso 4: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio:
   - Nombre: `pos-abarrotes` (o el que prefieras)
   - Descripción: "Sistema de punto de venta para tienda de abarrotes"
   - Elige si será público o privado
   - **NO marques** "Initialize this repository with a README" (ya tenemos uno)
   - Click en "Create repository"

### Paso 5: Conectar y subir

GitHub te mostrará comandos. Ejecuta estos (reemplaza `TU_USUARIO` con tu usuario de GitHub):

```bash
git remote add origin https://github.com/TU_USUARIO/pos-abarrotes.git
git branch -M main
git push -u origin main
```

Si te pide credenciales, usa tu usuario y un Personal Access Token (no tu contraseña):
- Ve a: https://github.com/settings/tokens
- Click en "Generate new token (classic)"
- Dale un nombre y selecciona el scope `repo`
- Copia el token y úsalo como contraseña

## Verificar que todo está bien

Después de subir, ve a tu repositorio en GitHub y deberías ver todos los archivos del proyecto.

## Actualizar el repositorio en el futuro

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

O usa GitHub Desktop y simplemente haz click en "Commit" y "Push origin".

## Configurar GitHub Pages (Para que la aplicación funcione en línea)

**IMPORTANTE**: Para que tu aplicación funcione en GitHub Pages, necesitas seguir estos pasos:

### Paso 1: Habilitar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, busca **Pages** (Páginas)
4. En **Source** (Fuente), selecciona:
   - **Source**: `GitHub Actions` (no "Deploy from a branch")
5. Guarda los cambios

### Paso 2: El workflow se ejecutará automáticamente

- El archivo `.github/workflows/deploy.yml` que ya está en el proyecto se encargará de:
  - Compilar tu aplicación automáticamente
  - Desplegarla en GitHub Pages cada vez que hagas `push` a la rama `main`

### Paso 3: Esperar el despliegue

1. Después de hacer `push`, ve a la pestaña **Actions** en tu repositorio
2. Verás un workflow ejecutándose llamado "Deploy to GitHub Pages"
3. Espera a que termine (puede tardar 1-2 minutos)
4. Cuando termine, verás un check verde ✅

### Paso 4: Acceder a tu aplicación

- Tu aplicación estará disponible en:
  - Si tu repositorio es `username.github.io`: `https://username.github.io`
  - Si tu repositorio es `username/repo-name`: `https://username.github.io/repo-name`

### Nota importante sobre la configuración

Si tu repositorio NO es `username.github.io` (es decir, es un repositorio de proyecto), necesitas cambiar el `base` en `vite.config.ts`:

1. Abre `vite.config.ts`
2. Cambia `base: '/'` por `base: '/nombre-de-tu-repositorio/'`
3. Haz commit y push de los cambios

Por ejemplo, si tu repositorio se llama `pos-abarrotes`, debería ser:
```typescript
base: '/pos-abarrotes/'
```
