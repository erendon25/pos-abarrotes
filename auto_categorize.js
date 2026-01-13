const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
// Asumimos que el service account ya está configurado en el script anterior o lo cargamos aquí
if (!admin.apps.length) {
    try {
        const serviceAccount = require('./firebase-service-account.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error("Error cargando credenciales:", e);
        process.exit(1);
    }
}

const db = admin.firestore();

// Mapa de reglas de categorización
// Orden: el primero que coincida gana
const REGLAS = [
    { cat: 'Lácteos', keywords: ['LECHE', 'YOGURT', 'QUESO', 'MANTEQUILLA', 'GLORIA', 'LAIVE', 'DANLAC', 'BONLE', 'PURA VIDA', 'IDEAL', 'ANCHOR'] },
    { cat: 'Bebidas', keywords: ['GASEOSA', 'COCA COLA', 'PEPSI', 'AGUA', 'JUGO', 'NECTAR', 'FRUGOS', 'PULP', 'SPORADE', 'GATORADE', 'VODKA', 'WHISKY', 'RON', 'CERVEZA', 'PILSEN', 'CRISTAL', 'CUSQUEÑA', 'VINO', 'FANTA', 'SPRITE', '7UP', 'GUARANA', 'INKA KOLA', 'VOLT', '360', 'RED BULL', 'MONSTER', 'CIFRUT', 'SAN LUIS', 'SAN MATEO', 'CIELO', 'LOA'] },
    { cat: 'Limpieza', keywords: ['DETERGENTE', 'JABON', 'CLORO', 'LEJIA', 'SUAVIZANTE', 'LAVAVAJILLAS', 'AYUDIN', 'SAPOLIO', 'ARIEL', 'ACE', 'MARSELLA', 'BOLIVAR', 'OPAL', 'PATITO', 'POETT', 'PATO', 'CLOROX', 'DESINFECTANTE', 'LIMPIA', 'ACIDO', 'LAVA'] },
    { cat: 'Higiene Personal', keywords: ['SHAMPOO', 'ACOND', 'JABON TOCADOR', 'DENTAL', 'KOLYNOS', 'COLGATE', 'DENTO', 'TOALLA HIG', 'PAÑAL', 'HUGGIES', 'BABYSEC', 'NIVEA', 'REXONA', 'DOVE', 'EGO', 'GILLETTE', 'AFEITAR', 'DESODORANTE', 'TALCO', 'CREMA', 'HEAD', 'PANTENE', 'SEDAL', 'SAVITAL', 'HS', 'OLD SPICE'] },
    { cat: 'Abarrotes', keywords: ['ARROZ', 'AZUCAR', 'FIDEO', 'ACEITE', 'CONSERVA', 'ATUN', 'GRATED', 'FILETE', 'SARDINA', 'MAYONESA', 'KETCHUP', 'MOSTAZA', 'SAL', 'AJINOMOTO', 'HARINA', 'AVENA', 'QUAKER', 'CEREAL', 'MENESTRA', 'LENTEJA', 'FRIJOL', 'PALLAR', 'ALVERJA', 'MAIZ', 'POPCORN', 'GELATINA', 'FLAN', 'MAZAMORRA', 'SOPA', 'AJINOMEN', 'RAMEN', 'PURE', 'SALSA', 'TUCO', 'VINAGRE', 'SILLAO', 'CHOCOLATE TAZA', 'COCOA', 'MILO', 'CAFE', 'NESCAFE', 'KIRMA', 'ALTOMAYO', 'MOCACCINO', 'CAPUCHINO', 'TE', 'ANIS', 'MANZANILLA', 'YERBA', 'MATE'] },
    { cat: 'Snacks y Golosinas', keywords: ['GALLETA', 'CHOCOLATE', 'CARAMELO', 'CHIZITO', 'PAPAS', 'LAYS', 'PRINGLES', 'PIQUEO', 'CHICLE', 'TRIDENT', 'HALLS', 'SUBLIME', 'TRIANGULO', 'PRINCESA', 'BESO', 'MAMA', 'MOROCHA', 'OREO', 'RITZ', 'SODA', 'VAINILLA', 'FIELD', 'COSTA', 'VICTORIA', 'WINTERS', 'DONOFRIO', 'FRUNA', 'GOMITA', 'MARSHMALLOW', 'TURRON', 'ALFAJOR', 'KEKE', 'BIMBO', 'PANETON'] },
    { cat: 'Mascotas', keywords: ['PERRO', 'GATO', 'CANBO', 'RICOCAN', 'RICOCAT', 'MIMASKOT', 'DOG CHOW', 'CAT CHOW', 'WHISKAS', 'ARENA', 'PEDIGREE'] },
    { cat: 'Hogar', keywords: ['PILA', 'DURACELL', 'PANASONIC', 'FOSFORO', 'ENCENDEDOR', 'VELA', 'BOMBILLA', 'FOCO', 'CINTA', 'PEGAMENTO', 'SUPER GLUE', 'ESCOBA', 'RECOGEDOR', 'TRAPEADOR', 'BOLSAS'] }
];

async function categorizarProductos() {
    console.log("Iniciando categorización inteligente...");

    // 1. Asegurar que las categorías existan en Firestore
    const batchCats = db.batch();
    const categoriasUnicas = new Set(REGLAS.map(r => r.cat));
    categoriasUnicas.add('Otros'); // Categoría default

    for (const catNombre of categoriasUnicas) {
        const ref = db.collection('categorias').doc(catNombre);
        batchCats.set(ref, { nombre: catNombre, subcategorias: [] }, { merge: true });
    }
    await batchCats.commit();
    console.log("Categorías base aseguradas.");

    // 2. Leer todos los productos
    const productosRef = db.collection('productos');
    const snapshot = await productosRef.get();

    console.log(`Analizando ${snapshot.size} productos...`);

    let batch = db.batch();
    let count = 0;
    let updatedCount = 0;
    let batchSize = 400;

    for (const doc of snapshot.docs) {
        const prod = doc.data();
        const nombre = prod.nombre.toUpperCase();
        let nuevaCategoria = 'Otros'; // Default

        // Buscar match
        for (const regla of REGLAS) {
            if (regla.keywords.some(k => nombre.includes(k))) {
                nuevaCategoria = regla.cat;
                break;
            }
        }

        // Solo actualizar si la categoría ha cambiado o es 'General'
        if (prod.categoria === 'General' || !prod.categoria || prod.categoria === 'Otros') {
            if (nuevaCategoria !== prod.categoria) {
                batch.update(doc.ref, { categoria: nuevaCategoria });
                updatedCount++;
                count++;
            }
        }

        if (count >= batchSize) {
            console.log(`Guardando lote de actualizaciones...`);
            await batch.commit();
            batch = db.batch();
            count = 0;
        }
    }

    if (count > 0) {
        console.log(`Guardando lote final...`);
        await batch.commit();
    }

    console.log(`\nProceso finalizado.`);
    console.log(`Se actualizaron ${updatedCount} productos con nuevas categorías.`);
    console.log(`Por favor, recarga la aplicación para ver los cambios.`);
}

categorizarProductos();
