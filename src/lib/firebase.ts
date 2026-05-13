declare global {
  interface Window {
    firebase: {
      initializeApp: (config: Record<string, string>) => { app: unknown };
      auth: () => FirebaseAuth;
      firestore: () => FirebaseFirestore;
    };
  }
}

interface FirebaseAuth {
  signInWithEmailAndPassword: (email: string, password: string) => Promise<FirebaseAuthResult>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<FirebaseAuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (user: FirebaseUser, data: { displayName: string }) => Promise<void>;
  currentUser: FirebaseUser | null;
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => () => void;
}

interface FirebaseAuthResult {
  user: FirebaseUser;
}

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface FirebaseFirestore {
  collection: (path: string) => FirebaseCollection;
  doc: (...segments: string[]) => FirebaseDoc;
}

interface FirebaseCollection {
  add: (data: Record<string, unknown>) => Promise<{ id: string }>;
  doc: (id: string) => FirebaseDoc;
  get: () => Promise<FirebaseQuerySnapshot>;
}

interface FirebaseDoc {
  get: () => Promise<FirebaseDocSnapshot>;
  set: (data: Record<string, unknown>) => Promise<void>;
  update: (data: Record<string, unknown>) => Promise<void>;
}

interface FirebaseDocSnapshot {
  id: string;
  exists: boolean;
  data: () => Record<string, unknown>;
}

interface FirebaseQuerySnapshot {
  docs: FirebaseQueryDocSnapshot[];
  size: number;
}

interface FirebaseQueryDocSnapshot {
  id: string;
  data: () => Record<string, unknown>;
}

function auth() {
  return window.firebase.auth();
}

function db() {
  return window.firebase.firestore();
}

function collection(path: string) {
  return window.firebase.firestore().collection(path);
}

function doc(...segments: string[]): FirebaseDoc {
  return window.firebase.firestore().doc(segments.join("/"));
}

async function getDoc(ref: FirebaseDoc) {
  return ref.get();
}

async function getDocs(col: FirebaseCollection) {
  return col.get();
}

async function addDoc(col: FirebaseCollection, data: Record<string, unknown>) {
  return col.add(data);
}

async function updateDoc(ref: FirebaseDoc, data: Record<string, unknown>) {
  return ref.update(data);
}

async function deleteDoc(ref: FirebaseDoc) {
  return ref.update({ _deleted: true, deletedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } });
}

async function setDoc(ref: FirebaseDoc, data: Record<string, unknown>) {
  return ref.set(data);
}

export {
  auth,
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
};
