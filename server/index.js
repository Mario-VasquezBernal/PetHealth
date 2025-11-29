const express = require('express');
const cors = require('cors');
// const pool = require('./db'); 

const app = express();

app.use(cors());
app.use(express.json());

// ⚠️ 1. MANEJO DE RUTAS (DEBE IR PRIMERO)
app.use("/auth", require("./routes/auth")); 
app.use("/vet", require("./routes/vet")); 
app.use("/appointments", require("./routes/appointments"));

// 2. RUTA DE PRUEBA (OPCIONAL, PERO NO DEBE CHOCAR)
app.get('/', (req, res) => {
    // Solo responde texto, no HTML
    res.send('Servidor de Mascotas funcionando 🐾'); 
});

// 3. MANEJO DE ERRORES/404 (OPCIONAL, PERO DEBE IR AL FINAL)
// Si ninguna ruta coincide, responde un 404 en JSON, no HTML.
app.use((req, res, next) => {
    res.status(404).json({ message: "Ruta no encontrada" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});