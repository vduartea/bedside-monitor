const pool = require("../../config/db");


/**
 * POST /api/notes
 * Body:
 * {
 *   "episode_id": 8,
 *   "note_text": "Paciente con riesgo de caída..."
 * }
 *
 * Seguridad:
 * - created_by se toma del token (req.user.userId) si existe
 * - si no existe, permite created_by en body (fallback)
 */
const createEpisodeNote = async (req, res) => {
  try {
    const { episode_id, note_text, created_by } = req.body;

    if (!episode_id || Number.isNaN(Number(episode_id))) {
      return res.status(400).json({ message: "episode_id es obligatorio y debe ser numérico." });
    }

    if (!note_text || typeof note_text !== "string" || !note_text.trim()) {
      return res.status(400).json({ message: "note_text es obligatorio." });
    }

    if (note_text.length > 2000) {
      return res.status(400).json({ message: "note_text no puede superar 2000 caracteres." });
    }

    // Ideal: tomar del token (tu login incluye userId en el payload). :contentReference[oaicite:4]{index=4}
    const userIdFromToken = req.user?.userId || req.user?.id;
    const finalCreatedBy = userIdFromToken ?? created_by ?? null;

    if (!finalCreatedBy) {
      return res.status(400).json({
        message: "No se pudo determinar el usuario creador. Asegura enviar token o created_by.",
      });
    }

    // Validar que el episodio exista
    const ep = await pool.query(`SELECT id FROM episode WHERE id = $1`, [episode_id]);
    if (ep.rowCount === 0) {
      return res.status(404).json({ message: `No existe el episodio con id=${episode_id}.` });
    }

    // Insertar nota
    const insertQuery = `
      INSERT INTO episode_notes (episode_id, created_by, note_text)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const inserted = await pool.query(insertQuery, [
      Number(episode_id),
      Number(finalCreatedBy),
      note_text.trim(),
    ]);

    return res.status(201).json({
      message: "Nota clínica creada correctamente",
      note: inserted.rows[0],
    });
  } catch (error) {
    console.error("Error en createEpisodeNote:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * GET /api/notes/:episode_id
 * Devuelve la lista completa de notas del episodio.
 * Incluye también datos básicos del usuario creador (si existe tabla users con esos campos).
 */
const getEpisodeNotes = async (req, res) => {
  try {
    const episode_id = Number(req.params.episode_id);

    if (!episode_id || Number.isNaN(episode_id)) {
      return res.status(400).json({ message: "episode_id inválido." });
    }

    // Validar que el episodio exista
    const ep = await pool.query(`SELECT id FROM episode WHERE id = $1`, [episode_id]);
    if (ep.rowCount === 0) {
      return res.status(404).json({ message: `No existe el episodio con id=${episode_id}.` });
    }

    // Traer notas (y opcionalmente info del usuario)
    // Ajusta nombres de columnas de users si difieren.
    const query = `
      SELECT
        en.*,
        json_build_object(
          'id', u.id,
          'nombres', u.nombres,
          'apellido1', u.apellido1,
          'apellido2', u.apellido2,
          'email', u.email,
          'rol', u.rol
        ) AS created_by_user
      FROM episode_notes en
      LEFT JOIN users u ON u.id = en.created_by
      WHERE en.episode_id = $1
      ORDER BY en.created_at DESC, en.id DESC;
    `;

    const result = await pool.query(query, [episode_id]);

    return res.status(200).json({
      message: "Notas del episodio obtenidas correctamente",
      episode_id,
      total: result.rowCount,
      notes: result.rows,
    });
  } catch (error) {
    console.error("Error en getEpisodeNotes:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

module.exports = { createEpisodeNote, getEpisodeNotes };
