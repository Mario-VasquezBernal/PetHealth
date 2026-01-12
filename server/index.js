const express = require('express');
const cors = require('cors');
const initCronJobs = require('./jobs/cronJobs'); // ✅ AGREGAR ESTA LÍNEA

const app = express();

// ✅ VERIFICAR VARIABLES DE ENTORNO AL INICIAR
console.log('🔐 JWT Secret cargado:', process.env.jwtSecret ? 'SÍ ✅' : 'NO ❌');
console.log('📧 SendGrid API Key cargado:', process.env.SENDGRID_API_KEY ? 'SÍ ✅' : 'NO ❌');
console.log('🌐 Frontend URL:', process.env.FRONTEND_URL || 'NO configurada (usando default)');

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors({
  origin: [
    'https://pet-health-s659.vercel.app',
    'https://willowy-madeleine-c31fcf.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(express.json());

// ========================================
// RUTAS
// ========================================
app.use("/auth", require("./routes/auth")); 
app.use("/vet", require("./routes/vet")); 
app.use("/appointments", require("./routes/appointments"));
app.use("/tasks", require("./routes/tasks"));
app.use("/clinics", require("./routes/clinics"));
app.use("/qr", require("./routes/qr"));
app.use("/medical-records", require("./routes/medicalRecords"));

// ========================================
// RUTA DE PRUEBA
// ========================================
app.get('/', (req, res) => {
    res.send('Servidor de Mascotas funcionando 🐾'); 
});

// ========================================
// INICIALIZAR CRON JOBS (NOTIFICACIONES)
// ========================================
initCronJobs(); // ✅ AGREGAR ESTA LÍNEA

// ========================================
// MANEJO DE ERRORES/404
// ========================================
app.use((req, res, next) => {
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
