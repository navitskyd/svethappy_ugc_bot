import {cert, getApps, initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

const {FIREBASE_SERVICE_ACCOUNT} = process.env;
if (!FIREBASE_SERVICE_ACCOUNT) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set in .env");

if (!getApps().length) {
    initializeApp({credential: cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT))});
}
export const CUSTOMERS_COLLECTION = "customers";
export const db = getFirestore();

