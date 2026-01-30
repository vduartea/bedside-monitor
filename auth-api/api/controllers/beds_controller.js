const db = require('../../config/db');

exports.createOrUpdateBed = async (req, res) => {
  try {
    const { id, code, service, specialty, status, location } = req.body;

    // Validar estado permitido
    const allowedStatus = ["Libre", "Ocupada", "Mantenimiento"];
    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Estado inválido. Use: Libre, Ocupada o Mantenimiento"
      });
    }

    // SI VIENE ID → ACTUALIZAR
    if (id) {
      const updateQuery = `
        UPDATE beds
        SET code = $1,
            service = $2,
            specialty = $3,
            status = $4,
            location = $5,
            updated_at = NOW()
        WHERE id = $6
        RETURNING *;
      `;

      const values = [code, service, specialty, status, location, id];

      const result = await db.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Cama no encontrada" });
      }

      return res.json({
        message: "Cama actualizada correctamente",
        bed: result.rows[0]
      });
    }

    // NO HAY ID → CREAR NUEVA CAMA
    const insertQuery = `
      INSERT INTO beds (code, service, specialty, status, location, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;

    const values = [code, service, specialty, status || "Libre", location];

    const result = await db.query(insertQuery, values);

    return res.json({
      message: "Cama creada correctamente",
      bed: result.rows[0]
    });
  } catch (error) {
    console.error("Error createOrUpdateBed:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
};

exports.getBeds = async (req, res) => {
  try {
    const query = "SELECT * FROM beds ORDER BY id ASC;";
    const result = await db.query(query);

    res.json({
      message: "Lista de camas obtenida correctamente",
      total: result.rows.length,
      beds: result.rows
    });
  } catch (error) {
    console.error("Error getBeds:", error);
    res.status(500).json({ message: "Error al obtener las camas" });
  }
};
