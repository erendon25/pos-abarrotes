import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplaza estos valores con la configuración de tu proyecto Firebase
// Puedes encontrarla en la consola de Firebase: Configuración del proyecto -> General -> Tus apps
const firebaseConfig = {
    apiKey: "AIzaSyA7ZlUJEuvuYmzZU_pZ2V8cmbZlniJ6zEI",
    authDomain: "tienda-abarrotes-82039.firebaseapp.com",
    projectId: "tienda-abarrotes-82039",
    storageBucket: "tienda-abarrotes-82039.firebasestorage.app",
    messagingSenderId: "983124080326",
    appId: "1:983124080326:web:03b0cda4bc7a7bbcd689c7",
    measurementId: "G-CG8DSHBEGT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
