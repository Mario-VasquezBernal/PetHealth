const express = require('express');
const cors = require('cors');
// const pool = require('./db'); 

const app = express();

app.use(cors());
app.use(express.json());

// RUTAS
app.use("/auth", require("./routes/auth")); 
app.use("/vet", require("./routes/vet")); 
app.use("/appointments", require("./routes/appointments"));
app.use("/tasks", require("./routes/tasks"));
app.use("/clinics", require("./routes/clinics")); // <--- RUTA DE CLÍNICAS

// RUTA DE PRUEBA
app.get('/', (req, res) => {
    res.send('Servidor de Mascotas funcionando 🐾'); 
});

// MANEJO DE ERRORES/404
app.use((req, res, next) => {
    res.status(404).json({ message: "Ruta no encontrada" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});