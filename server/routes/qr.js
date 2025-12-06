const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");
const crypto = require("crypto");
const QRCode = require("qrcode"); // ✅ AGREGAR ESTO

// ========================================
// 1. GENERAR CÓDIGO QR PARA UNA MASCOTA
// ========================================
router.post("/generate/:petId", authorization, async (req, res) => {
  try {
    const { petId } = req.params;

    // Verificar que la mascota pertenece al usuario
    const pet = await pool.query(
      "SELECT * FROM pets WHERE id = $1 AND user_id = $2",
      [petId, req.user]
    );

    if (pet.rows.length === 0) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    // Generar token único
    const qrToken = crypto.randomBytes(32).toString("hex");

    // Guardar el token en la base de datos (válido por 15 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // ✅ 15 minutos

    await pool.query(
      `INSERT INTO qr_tokens (pet_id, token, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (pet_id) 
       DO UPDATE SET token = $2, expires_at = $3, created_at = NOW()`,
      [petId, qrToken, expiresAt]
    );

    // Generar URL del QR
    const vetAccessUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/qr/${qrToken}`;

    // ✅ GENERAR IMAGEN QR EN BASE64
    const qrImage = await QRCode.toDataURL(vetAccessUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    return res.json({
      success: true,
      token: qrToken,
      qrImage, // ✅ IMAGEN EN BASE64
      vetAccessUrl,
      expiresAt
    });

  } catch (err) {
    console.error("Error al generar QR:", err.message);
    return res.status(500).json({ error: "Error al generar código QR" });
  }
});

// ========================================
// 2. VALIDAR TOKEN QR (Público - Sin Auth)
// ========================================
router.get("/validate/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar el token en la BD
    const qrToken = await pool.query(
      `SELECT qt.*, p.*, u.full_name as owner_name, u.phone as owner_phone, u.email as owner_email
       FROM qr_tokens qt
       JOIN pets p ON qt.pet_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE qt.token = $1 AND qt.expires_at > NOW()`,
      [token]
    );

    if (qrToken.rows.length === 0) {
      return res.status(404).json({ error: "Token inválido o expirado" });
    }

    return res.json({
      success: true,
      pet: {
        id: qrToken.rows[0].pet_id,
        name: qrToken.rows[0].name,
        species: qrToken.rows[0].species,
        breed: qrToken.rows[0].breed,
        birth_date: qrToken.rows[0].birth_date,
        gender: qrToken.rows[0].gender,
        photo_url: qrToken.rows[0].photo_url,
        allergies: qrToken.rows[0].allergies,
        is_sterilized: qrToken.rows[0].is_sterilized
      },
      owner: {
        name: qrToken.rows[0].owner_name,
        phone: qrToken.rows[0].owner_phone,
        email: qrToken.rows[0].owner_email
      }
    });

  } catch (err) {
    console.error("Error al validar token:", err.message);
    return res.status(500).json({ error: "Error al validar token" });
  }
});

module.exports = router;
