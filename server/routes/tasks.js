const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const sendEmail = require("../utils/emailService"); 

// Función auxiliar para obtener el nombre completo del dueño
const getOwnerInfo = async (owner_id) => {
    const user = await pool.query("SELECT full_name, email FROM users WHERE id = $1", [owner_id]);
    return user.rows[0];
}

// 1. OBTENER TAREAS PENDIENTES (Para el Dashboard del DUEÑO)
router.get("/owner", authorization, async (req, res) => {
    try {
        const tasks = await pool.query(
            `SELECT 
                t.id, 
                t.task_type, 
                t.description, 
                t.is_completed, 
                p.name as pet_name,
                p.species as pet_type,
                to_char(t.created_at, 'DD Mon YYYY') as date 
             FROM tasks t
             JOIN pets p ON t.pet_id = p.id
             WHERE t.owner_id = $1
             ORDER BY t.created_at DESC`,
            [req.user]
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error del servidor");
    }
});


// 2. CREAR NUEVA TAREA/SOLICITUD (Botón 'Solicitar Revisión')
router.post("/", authorization, async (req, res) => {
    try {
        const { pet_id, description, task_type, vet_id } = req.body;
        
        // Creamos la tarea en DB
        const newTask = await pool.query(
            `INSERT INTO tasks (owner_id, pet_id, description, task_type, vet_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [req.user, pet_id, description, task_type, vet_id || null]
        );

        // Opcional: Enviar notificación al veterinario o al admin aquí
        const pet = await pool.query("SELECT name FROM pets WHERE id = $1", [pet_id]);
        const owner = await getOwnerInfo(req.user);

        const subject = "⚠️ Nueva Solicitud de Revisión: " + pet.rows[0].name;
        const message = `El dueño ${owner.full_name} solicita una revisión para la mascota ${pet.rows[0].name}.\n\nDescripción: ${description}`;
        
        sendEmail("admin@clinicavet.com", subject, message); // Correo de prueba
        
        res.json({ id: newTask.rows[0].id, message: "Tarea creada" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error del servidor");
    }
});

module.exports = router;