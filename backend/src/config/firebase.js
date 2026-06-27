import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let firebaseAdminApp = null;
let isConfigured = false;

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (serviceAccountPath) {
  try {
    const absolutePath = path.resolve(serviceAccountPath);
    if (fs.existsSync(absolutePath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      
      // Sanitize private key by replacing double-escaped newlines with real newlines
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isConfigured = true;
      console.log('Firebase Admin SDK successfully initialized using credentials file.');
    } else {
      console.warn(`Firebase credentials file not found at: ${absolutePath}`);
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
} else {
  console.warn(
    'FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set. Express server is running in Mock Authentication verification mode.'
  );
}

export { admin, firebaseAdminApp, isConfigured };
export default admin;
