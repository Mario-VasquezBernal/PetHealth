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
            [req.user.id]
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
        
        console.log('📝 Creando nueva tarea para pet_id:', pet_id);
        
        // Creamos la tarea en DB
        const newTask = await pool.query(
            `INSERT INTO tasks (owner_id, pet_id, description, task_type, vet_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [req.user.id, pet_id, description, task_type, vet_id || null]

        );

        // ✅ Obtener información del dueño y la mascota
        const pet = await pool.query("SELECT name FROM pets WHERE id = $1", [pet_id]);
        const owner = await getOwnerInfo(req.user.id);

        console.log('👤 Owner info:', owner);
        console.log('🐾 Pet name:', pet.rows[0].name);

        // ✅ Enviar email al DUEÑO (no a un admin inexistente)
        const subject = `🐾 PetHealth - Nueva tarea creada para ${pet.rows[0].name}`;
        const message = `Hola ${owner.full_name},\n\nSe ha creado una nueva tarea para tu mascota ${pet.rows[0].name}.\n\nTipo: ${task_type}\nDescripción: ${description}\n\n¡Gracias por usar PetHealth! 🐾`;
        
        // ✅ Enviar email y esperar resultado
        const emailResult = await sendEmail(owner.email, subject, message);
        
        if (emailResult.success) {
            console.log('✅ Email enviado correctamente a:', owner.email);
        } else {
            console.error('❌ Error al enviar email:', emailResult.error);
        }
        
        res.json({ 
            id: newTask.rows[0].id, 
            message: "Tarea creada", 
            emailSent: emailResult.success 
        });
    } catch (err) {
        console.error('❌ Error al crear tarea:', err.message);
        res.status(500).send("Error del servidor");
    }
});


module.exports = router;
