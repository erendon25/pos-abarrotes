const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    try {
        const serviceAccount = require('./firebase-service-account.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error("Error cargando credenciales. Asegúrate de que 'firebase-service-account.json' existe.", e);
        process.exit(1);
    }
}

const db = admin.firestore();

async function procesarProductos() {
    const filePath = path.join(__dirname, 'datos_productos.txt');

    if (!fs.existsSync(filePath)) {
        console.error("No se encontró e archivo 'datos_productos.txt'.");
        return;
    }

    console.log("Leyendo datos...");
    const data = fs.readFileSync(filePath, 'utf8');
    const lineas = data.split('\n');

    let batch = db.batch();
    let count = 0;
    let total = 0;
    const batchSize = 400; // Límite de Firestore es 500 operaciones por batch

    // Asegurar que exista la categoría General
    const categoriaRef = db.collection('categorias').doc('General');
    await categoriaRef.set({ nombre: 'General', subcategorias: [] }, { merge: true });

    console.log(`Procesando ${lineas.length} líneas...`);

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;
        if (linea.startsWith('ID') && linea.includes('PRODUCTO')) continue; // Saltar cabecera

        // Intentar separar por tabulación
        let partes = linea.split('\t');

        // Si no hay tabs, intentar con regex que busque 2 o más espacios (fallback básico)
        if (partes.length < 2) {
            partes = linea.split(/ {2,}/);
        }

        if (partes.length < 2) {
            console.warn(`Línea ${i + 1} no se pudo parsear correctamente: ${linea}`);
            continue;
        }

        // Mapeo basado en formato: ID | PRODUCTO | DESCRIPCION | PRECIO | CANTIDAD
        // A veces la descripción puede faltar o unirse
        let id = partes[0] ? partes[0].trim() : '';
        let nombre = partes[1] ? partes[1].trim() : '';
        let precioStr = '';
        let stockStr = '';

        // Buscar precio y stock en las últimas columnas
        // Estrategia: Buscar la columna que contiene "S/"
        let precioIndex = partes.findIndex(p => p.includes('S/'));

        if (precioIndex !== -1) {
            precioStr = partes[precioIndex];
            // La cantidad suele ser la siguiente columna
            if (partes[precioIndex + 1]) {
                stockStr = partes[precioIndex + 1];
            } else if (partes[partes.length - 1]) {
                // Si no hay siguiente, tomamos la última
                stockStr = partes[partes.length - 1];
            }
        } else {
            // Fallback: Asumir posición fija si no hay "S/" explícito
            // Si hay 5 columnas: ID, PROD, DESC, PRECIO, STOCK
            if (partes.length >= 5) {
                precioStr = partes[3];
                stockStr = partes[4];
            } else if (partes.length === 4) {
                // ID, PROD, PRECIO, STOCK
                precioStr = partes[2];
                stockStr = partes[3];
            }
        }

        // Limpieza de Precio
        let precio = 0;
        if (precioStr) {
            // Remover "S/", espacios y comas si las hay
            let limpio = precioStr.replace('S/', '').replace(/,/g, '').trim();
            precio = parseFloat(limpio);
        }

        // Limpieza de Stock
        let stock = 0;
        if (stockStr) {
            let limpio = stockStr.replace(/,/g, '').trim();
            stock = parseFloat(limpio); // Usamos float por si acaso, luego floor
            stock = Math.floor(stock);
        }

        if (!id || id === 'MAXIMO' || id.length < 2) continue; // Validaciones simples

        const producto = {
            id: id,
            codigoBarras: id,
            nombre: nombre,
            precio: isNaN(precio) ? 0 : precio,
            stock: isNaN(stock) ? 0 : stock,
            categoria: 'General', // Asignamos categoría general para subir rápido
            fechaCreacion: new Date()
            // Opcional: descripción si la tenemos
        };

        const docRef = db.collection('productos').doc(id);
        batch.set(docRef, producto);

        count++;
        total++;

        if (count >= batchSize) {
            console.log(`Subiendo lote de ${count} productos... (Total procesados: ${total})`);
            await batch.commit();
            batch = db.batch();
            count = 0;
        }
    }

    if (count > 0) {
        console.log(`Subiendo lote final de ${count} productos...`);
        await batch.commit();
    }

    console.log(`\nImportación completada. Se subieron ${total} productos.`);
}

procesarProductos();
