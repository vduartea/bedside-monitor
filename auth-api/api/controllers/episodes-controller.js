const pool = require("../../config/db");

const getActiveEpisodesFull = async (req, res) => {
  try {
    // Si tu middleware agrega req.user con userId/rol, puedes usarlo aquí.
    // En tu doc: el token incluye userId y rol en el payload. :contentReference[oaicite:2]{index=2}

    const query = `
      SELECT
        -- Todos los campos de episode, patient y beds en objetos separados:
        to_jsonb(e) AS episode,
        to_jsonb(p) AS patient,
        to_jsonb(b) AS bed,

        -- Últimos resultados por escala (0..N)
        COALESCE(sa.latest_scales, '[]'::jsonb) AS latest_scales

      FROM episode e
      JOIN patient p ON p.id = e.patient_id
      LEFT JOIN beds b ON b.id = e.bed_id

      -- LATERAL para calcular "última aplicación por escala" por cada episodio
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'scale_id', s.id,
            'scale_name', s.name,
            'scale_version', s.version,
            'thresholds', s.thresholds,
            'application', jsonb_build_object(
              'id', last_app.id,
              'episode_id', last_app.episode_id,
              'scale_id', last_app.scale_id,
              'total_score', last_app.total_score,
              'result_detail', last_app.result_detail,
              'applied_at', last_app.applied_at,
              'applied_by', last_app.applied_by,
              'created_at', last_app.created_at
            )
          )
          ORDER BY last_app.applied_at DESC, last_app.id DESC
        ) AS latest_scales
        FROM (
          -- 1 fila por (episode_id, scale_id): la más reciente
          SELECT DISTINCT ON (episode_id, scale_id) *
          FROM scale_application
          WHERE episode_id = e.id
          ORDER BY episode_id, scale_id, applied_at DESC, id DESC
        ) last_app
        JOIN scale s ON s.id = last_app.scale_id
      ) sa ON TRUE

      WHERE e.discharge_datetime IS NULL
      ORDER BY e.admission_datetime DESC, e.id DESC;
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      message: "Episodios activos obtenidos correctamente",
      total: result.rowCount,
      episodes: result.rows
    });
  } catch (error) {
    console.error("Error en getActiveEpisodesFull:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

module.exports = { getActiveEpisodesFull };
