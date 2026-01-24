const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const crypto = require("crypto");
const QRCode = require("qrcode");

// ========================================
// 1. OBTENER LISTAS (nuevo endpoint)
// ========================================
router.get("/options", authorization, async (req, res) => {
  try {
    const vetsQuery = await pool.query(
      'SELECT id, name, specialty, clinic_id FROM veterinarians ORDER BY name'
    );
    
    const clinicsQuery = await pool.query(
      'SELECT id, name, address, phone FROM clinics ORDER BY name'
    );

    return res.json({
      veterinarians: vetsQuery.rows,
      clinics: clinicsQuery.rows
    });
  } catch (err) {
    console.error("Error al obtener opciones:", err.message);
    return res.status(500).json({ error: "Error al cargar opciones" });
  }
});

// ========================================
// 2. GENERAR CÓDIGO QR (ACTUALIZADO)
// ========================================
router.post("/generate/:petId", authorization, async (req, res) => {
  try {
    const { petId } = req.params;
    const { vetId, clinicId } = req.body; // ✅ NUEVO: Recibe vet y clínica

    // Validar que se envíen los IDs requeridos
    if (!vetId || !clinicId) {
      return res.status(400).json({ 
        error: "Debes seleccionar un veterinario y una clínica" 
      });
    }

    // Verificar que la mascota pertenece al usuario
    const pet = await pool.query(
      "SELECT * FROM pets WHERE id = $1 AND user_id = $2",
      [petId, req.user.id]
    );

    if (pet.rows.length === 0) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    // Verificar que existan el vet y la clínica
    const vetExists = await pool.query(
      "SELECT * FROM veterinarians WHERE id = $1",
      [vetId]
    );

    const clinicExists = await pool.query(
      "SELECT * FROM clinics WHERE id = $1",
      [clinicId]
    );

    if (vetExists.rows.length === 0) {
      return res.status(404).json({ error: "Veterinario no encontrado" });
    }

    if (clinicExists.rows.length === 0) {
      return res.status(404).json({ error: "Clínica no encontrada" });
    }

    // Generar token único
    const qrToken = crypto.randomBytes(32).toString("hex");

    // Guardar el token en la base de datos (válido por 24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await pool.query(
      `INSERT INTO qr_tokens (pet_id, token, expires_at, vet_id, clinic_id) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (pet_id) 
       DO UPDATE SET token = $2, expires_at = $3, vet_id = $4, clinic_id = $5, created_at = NOW()`,
      [petId, qrToken, expiresAt, vetId, clinicId]
    );

    // Generar URL del QR
    const vetAccessUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/qr/${qrToken}`;

    // Generar imagen QR en BASE64
    const qrImage = await QRCode.toDataURL(vetAccessUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    return res.json({
      success: true,
      token: qrToken,
      qrImage,
      vetAccessUrl,
      expiresAt,
      assignedVet: vetExists.rows[0],
      assignedClinic: clinicExists.rows[0]
    });

  } catch (err) {
    console.error("Error al generar QR:", err.message);
    return res.status(500).json({ error: "Error al generar código QR" });
  }
});

// ========================================
// 3. VALIDAR TOKEN QR (ACTUALIZADO)
// ========================================
router.get("/validate/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar el token con toda la info relacionada
    const qrToken = await pool.query(
      `SELECT 
         qt.*,
         p.*,
         u.full_name as owner_name, 
         u.phone as owner_phone, 
         u.email as owner_email,
         v.name as vet_name,
         v.specialty as vet_specialty,
         c.name as clinic_name,
         c.address as clinic_address,
         c.phone as clinic_phone
       FROM qr_tokens qt
       JOIN pets p ON qt.pet_id = p.id
       JOIN users u ON p.user_id = u.id
       LEFT JOIN veterinarians v ON qt.vet_id = v.id
       LEFT JOIN clinics c ON qt.clinic_id = c.id
       WHERE qt.token = $1 AND qt.expires_at > NOW()`,
      [token]
    );

    if (qrToken.rows.length === 0) {
      return res.status(404).json({ error: "Token inválido o expirado" });
    }

    const data = qrToken.rows[0];

    return res.json({
      success: true,
      pet: {
        id: data.pet_id,
        name: data.name,
        species: data.species,
        breed: data.breed,
        birth_date: data.birth_date,
        gender: data.gender,
        weight: data.weight,
        photo_url: data.photo_url,
        allergies: data.allergies,
        is_sterilized: data.is_sterilized,
        owner_name: data.owner_name,
        owner_phone: data.owner_phone,
        owner_email: data.owner_email
      },
      // ✅ Info pre-asignada por el propietario
      assignedVet: {
        id: data.vet_id,
        name: data.vet_name,
        specialty: data.vet_specialty
      },
      assignedClinic: {
        id: data.clinic_id,
        name: data.clinic_name,
        address: data.clinic_address,
        phone: data.clinic_phone
      },
      token: token
    });

  } catch (err) {
    console.error("Error al validar token:", err.message);
    return res.status(500).json({ error: "Error al validar token" });
  }
});

module.exports = router;
