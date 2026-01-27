console.log("✅ RATINGS ROUTER FILE LOADED");
const express = require('express');
const cors = require('cors');
const initCronJobs = require('./jobs/cronJobs');

const clinicsRouter = require('./routes/clinics');
const veterinariansRouter = require('./routes/veterinarians');
const ratingsRouter = require('./routes/ratings');
const aiRoutes = require('./routes/ai');

const app = express();

// ✅ EVITA 304 POR ETAG
app.disable('etag');

// ✅ VERIFICAR VARIABLES DE ENTORNO AL INICIAR
console.log('🔐 JWT Secret cargado:', process.env.jwtSecret ? 'SÍ ✅' : 'NO ❌');
console.log('📧 SendGrid API Key cargado:', process.env.SENDGRID_API_KEY ? 'SÍ ✅' : 'NO ❌');
console.log('🌐 Frontend URL:', process.env.FRONTEND_URL || 'NO configurada (usando default)');

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));



// ✅ ESTE DEBE IR ANTES DE LAS RUTAS
app.use(express.json());

// ✅ NO CACHE PARA API
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ========================================
// RUTAS
// ========================================
app.use("/auth", require("./routes/auth"));
app.use("/vet", require("./routes/vet"));
app.use("/appointments", require("./routes/appointments"));
app.use("/tasks", require("./routes/tasks"));
app.use("/clinics", clinicsRouter);
app.use("/veterinarians", veterinariansRouter);
app.use("/qr", require("./routes/qr"));
app.use("/medical-records", require("./routes/medicalRecords"));
app.use("/ratings", ratingsRouter);

// ✅ AHORA SÍ: IA
app.use('/ai', aiRoutes);

// ========================================
// RUTA DE PRUEBA
// ========================================
app.get('/', (req, res) => {
  res.send('Servidor de Mascotas funcionando 🐾');
});

// ========================================
// INICIALIZAR CRON JOBS
// ========================================
initCronJobs();

// ========================================
// 404
// ========================================
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// ========================================
// SERVIDOR
// ========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log('✅ Sistema de notificaciones activado');
});
