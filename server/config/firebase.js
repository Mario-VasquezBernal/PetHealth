const admin = require('firebase-admin');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error('❌ Error parseando FIREBASE_SERVICE_ACCOUNT');
    throw err;
  }
} else {
  throw new Error('FIREBASE_SERVICE_ACCOUNT no está definido');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
