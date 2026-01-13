
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');
const productos = require('./src/data/productos.json');
const categorias = require('./src/data/categorias.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadData() {
  try {
    console.log('Borrando colecciones existentes para asegurar inicio limpio...');
    // Opcional: Borrar colecciones existentes si se desea sobrescribir siempre
    // Por seguridad, solo subiremos documentos.

    console.log('Subiendo productos...');
    const batchProductos = db.batch();
    productos.forEach(producto => {
      const docRef = db.collection('productos').doc(producto.id);
      batchProductos.set(docRef, producto);
    });
    await batchProductos.commit();
    console.log(`${productos.length} productos subidos.`);

    console.log('Subiendo categorías...');
    const batchCategorias = db.batch();
    categorias.forEach(categoria => {
      // Usamos el nombre como ID para categorías para mantener consistencia, 
      // o dejamos que firestore genere ID. En App.tsx, categorías no tenían ID explícito más allá del nombre.
      // Pero mejor generar un ID si no tienen.
      // En App.tsx, las categorías son identificadas por nombre.
      // Para firestore, usaremos el nombre como ID para evitar duplicados.
      const docRef = db.collection('categorias').doc(categoria.nombre);
      batchCategorias.set(docRef, categoria);
    });
    await batchCategorias.commit();
    console.log(`${categorias.length} categorías subidas.`);

    console.log('Datos subidos exitosamente.');
  } catch (error) {
    console.error('Error subiendo datos:', error);
  } finally {
    process.exit();
  }
}

uploadData();
