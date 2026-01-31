// ============================================
// SERVER/INDEX.JS (VERSIÓN RESTAURADA)
// ============================================
console.log("✅ SERVER STARTING...");
const express = require('express');
const cors = require('cors');
const initCronJobs = require('./jobs/cronJobs');

// Importación de rutas
const clinicsRouter = require('./routes/clinics');
const veterinariansRouter = require('./routes/veterinarians');
const ratingsRouter = require('./routes/ratings');
const aiRoutes = require('./routes/ai');
const publicRoutes = require('./routes/public.routes'); 

const app = express();

app.disable('etag');

// VERIFICACIÓN DE VARIABLES (Tus logs originales)
console.log('🔐 JWT Secret cargado:', process.env.jwtSecret ? 'SÍ ✅' : 'NO ❌');
console.log('📧 SendGrid API Key cargado:', process.env.SENDGRID_API_KEY ? 'SÍ ✅' : 'NO ❌');

// Middlewares
app.use(cors({ origin: true, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));
app.use(express.json());
app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// ========================================
// RUTAS (SIN EL PREFIJO /api QUE ROMPIÓ TODO)
// ========================================

// 1. Ruta Pública (QR) - Esta sí lleva /api/public porque así la configuramos en el QR
app.use("/api/public", publicRoutes); 

// 2. Rutas del Sistema (Tal cual las tenías)
app.use("/auth", require("./routes/auth"));
app.use("/vet", require("./routes/vet"));
app.use("/appointments", require("./routes/appointments"));
app.use("/tasks", require("./routes/tasks"));

app.use("/clinics", clinicsRouter);           // <--- Restaurado a "/clinics"
app.use("/veterinarians", veterinariansRouter); // <--- Restaurado a "/veterinarians"
app.use("/ratings", ratingsRouter);           // <--- Restaurado a "/ratings"

app.use("/qr", require("./routes/qr"));
app.use("/medical-records", require("./routes/medicalRecords"));
app.use('/ai', aiRoutes);

// Ruta base
app.get('/', (req, res) => res.send('Servidor de Mascotas funcionando 🐾'));

// 404
app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  initCronJobs();
});