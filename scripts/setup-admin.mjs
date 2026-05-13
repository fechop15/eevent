import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app-compat.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth-compat.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore-compat.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6WecBcLCjDM1gUnWLksDpfSgNb2-EcqE",
  authDomain: "eevent-59ae4.firebaseapp.com",
  projectId: "eevent-59ae4",
  storageBucket: "eevent-59ae4.firebasestorage.app",
  messagingSenderId: "101879572487",
  appId: "1:101879572487:web:82dfd11f1501c7b3e662a2",
  measurementId: "G-XE4H2KN33D",
};

const ADMIN = {
  cedula: "123456789",
  password: "Admin123456",
  nombre: "Administrador",
  apellido: "EEvent",
  rol: "admin",
  estado: "activo",
};

async function setup() {
  console.log("Iniciando setup de EEvent...\n");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    console.log(`Creando usuario en Auth: ${ADMIN.cedula}@eevent.com`);
    const { user } = await createUserWithEmailAndPassword(auth, `${ADMIN.cedula}@eevent.com`, ADMIN.password);
    console.log(`  UID: ${user.uid}`);

    await signOut(auth);

    console.log(`\nCreando documento en Firestore (coleccion: usuarios, id: ${user.uid})`);
    await setDoc(doc(db, "usuarios", user.uid), {
      cedula: ADMIN.cedula,
      nombre: ADMIN.nombre,
      apellido: ADMIN.apellido,
      email: `${ADMIN.cedula}@eevent.com`,
      rol: ADMIN.rol,
      estado: ADMIN.estado,
      fechaCreacion: serverTimestamp(),
      ultimoAcceso: serverTimestamp(),
    });
    console.log("  OK");

    console.log("\n========================================");
    console.log("  Setup completado exitosamente!");
    console.log("========================================");
    console.log("\nCredenciales de acceso:");
    console.log(`  Cedula:  ${ADMIN.cedula}`);
    console.log(`  Contrasena: ${ADMIN.password}`);
    console.log(`  Rol:     ${ADMIN.rol}`);
    console.log("\nPublica las reglas de Firestore desde:");
    console.log("  firestore.rules -> Firebase Console > Firestore > Reglas\n");
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      console.log("\nEl usuario ya existe en Auth.");
      console.log("Si el documento en Firestore no existe, crealo manualmente.");
      console.log("\nCredenciales de acceso:");
      console.log(`  Cedula:  ${ADMIN.cedula}`);
      console.log(`  Contrasena: ${ADMIN.password}`);
    } else {
      console.error("\nError:", error.message);
    }
  }
}

setup();