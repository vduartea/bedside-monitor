const pool = require("../../config/db");

/**
 * POST /api/scale-applications
 * Body esperado (nuevo modelo):
 * {
 *   "episode_id": 8,
 *   "scale_id": 2,
 *   "applied_by": 1,              // opcional
 *   "applied_at": "2026-01-22T10:30:00.000Z", // opcional
 *   "result_detail": { ... },     // opcional
 *   "details": [
 *     {
 *       "question_id": 7,
 *       "selected_option_ids": [101]  // simple: 1 opción; múltiple: N opciones
 *     }
 *   ]
 * }
 *
 * Reglas:
 * - Episodio debe estar activo (discharge_datetime IS NULL)
 * - No se edita: cada POST crea una nueva aplicación
 * - Guarda todo en una transacción
 * - Calcula score desde scale_question_option.score
 */
 
 // POST para aplicar una escala
const applyScale = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      episode_id,
      scale_id,
      applied_by,
      applied_at,
      result_detail,
      details,
    } = req.body;

    if (!episode_id || !scale_id) {
      return res.status(400).json({ message: "episode_id y scale_id son obligatorios." });
    }

    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({
        message: "details es obligatorio y debe tener al menos 1 registro.",
      });
    }

    // Validación de estructura básica
    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      if (!d.question_id) {
        return res.status(400).json({ message: `details[${i}].question_id es obligatorio.` });
      }
      if (!Array.isArray(d.selected_option_ids)) {
        return res.status(400).json({
          message: `details[${i}].selected_option_ids debe ser un array.`,
        });
      }
      // Permite 0 si quieres soportar "sin selección"; si NO, exige >=1
      if (d.selected_option_ids.length === 0) {
        return res.status(400).json({
          message: `details[${i}].selected_option_ids debe tener al menos 1 opción seleccionada.`,
        });
      }
    }

    await client.query("BEGIN");

    // 1) Validar episodio activo
    const ep = await client.query(
      `SELECT id FROM episode WHERE id = $1 AND discharge_datetime IS NULL`,
      [episode_id]
    );
    if (ep.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "El episodio no existe o no está activo (tiene discharge_datetime).",
      });
    }

    // 2) Validar escala exista
    const sc = await client.query(`SELECT id FROM scale WHERE id = $1`, [scale_id]);
    if (sc.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: `No existe la escala con id=${scale_id}.` });
    }

    // 3) Validar preguntas pertenecen a la escala y obtener is_multi_select
    const questionIds = details.map((d) => d.question_id);
    const qRes = await client.query(
      `SELECT id, is_multi_select
       FROM scale_question
       WHERE scale_id = $1 AND id = ANY($2::int[])`,
      [scale_id, questionIds]
    );

    if (qRes.rowCount !== questionIds.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Una o más preguntas (question_id) no pertenecen a la escala indicada.",
      });
    }

    const questionMeta = new Map(); // question_id -> { is_multi_select }
    qRes.rows.forEach((r) => questionMeta.set(r.id, { is_multi_select: r.is_multi_select }));

    // 4) Validar selección simple vs múltiple
    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      const meta = questionMeta.get(d.question_id);

      if (!meta) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: `Pregunta inválida: ${d.question_id}` });
      }

      if (!meta.is_multi_select && d.selected_option_ids.length > 1) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: `La pregunta ${d.question_id} es de selección simple, pero recibiste múltiples opciones.`,
        });
      }
    }

    // 5) Crear cabecera (total_score se calculará después)
    const insertApplicationQuery = `
      INSERT INTO scale_application
        (episode_id, scale_id, total_score, result_detail, applied_at, applied_by)
      VALUES
        ($1, $2, 0, $3, COALESCE($4, NOW()), $5)
      RETURNING id, episode_id, scale_id, total_score, result_detail, applied_at, applied_by, created_at;
    `;

    const appInsert = await client.query(insertApplicationQuery, [
      episode_id,
      scale_id,
      result_detail ?? null,
      applied_at ?? null,
      applied_by ?? null,
    ]);

    const application = appInsert.rows[0];
    const scale_application_id = application.id;

    // 6) Insert detalle por pregunta + selections por opción
    const insertDetailQuery = `
      INSERT INTO scale_application_detail
        (scale_application_id, question_id, score, answer)
      VALUES
        ($1, $2, $3, $4)
      RETURNING id, scale_application_id, question_id, score, answer, created_at;
    `;

    const insertSelectionQuery = `
      INSERT INTO scale_application_selection
        (scale_application_detail_id, option_id)
      VALUES
        ($1, $2)
      RETURNING id, scale_application_detail_id, option_id, created_at;
    `;

    let totalScoreComputed = 0;
    const insertedDetails = [];

    for (const d of details) {
      // 6.1) Validar que las opciones pertenezcan a la pregunta y obtener score/text
      const optionIds = d.selected_option_ids;

      const optRes = await client.query(
        `SELECT id, option_text, score
         FROM scale_question_option
         WHERE question_id = $1 AND id = ANY($2::int[])`,
        [d.question_id, optionIds]
      );

      if (optRes.rowCount !== optionIds.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: `Una o más opciones no pertenecen a la pregunta ${d.question_id}.`,
        });
      }

      const questionScore = optRes.rows.reduce((acc, o) => acc + Number(o.score || 0), 0);
      totalScoreComputed += questionScore;

      // answer textual opcional (útil para reporting rápido)
      const answerText = optRes.rows.map((o) => o.option_text).join(", ");

      // 6.2) Insert detail (1 por pregunta)
      const detIns = await client.query(insertDetailQuery, [
        scale_application_id,
        d.question_id,
        questionScore,
        answerText || null,
      ]);

      const detailRow = detIns.rows[0];

      // 6.3) Insert selections (N por opciones)
      const selections = [];
      for (const opt of optRes.rows) {
        const selIns = await client.query(insertSelectionQuery, [
          detailRow.id,
          opt.id,
        ]);
        selections.push({
          ...selIns.rows[0],
          option_text: opt.option_text,
          score: opt.score,
        });
      }

      insertedDetails.push({
        ...detailRow,
        selected_options: selections,
      });
    }

    // 7) Actualizar total_score ya calculado
    const upd = await client.query(
      `UPDATE scale_application
       SET total_score = $1
       WHERE id = $2
       RETURNING id, episode_id, scale_id, total_score, result_detail, applied_at, applied_by, created_at;`,
      [totalScoreComputed, scale_application_id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Escala aplicada correctamente",
      application: upd.rows[0],
      details: insertedDetails,
    });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("Error en applyScale:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  } finally {
    client.release();
  }
};

/**
 * GET /api/scale-applications/latest?episode_id=8&scale_id=2
 * Devuelve la última aplicación de una escala en un episodio, con detalle y opciones seleccionadas.
 */
 
// GET Historial de Escalas
const getLatestScaleApplication = async (req, res) => {
  try {
    const episode_id = Number(req.query.episode_id);
    const scale_id = Number(req.query.scale_id);

    if (!episode_id || !scale_id) {
      return res.status(400).json({
        message: "episode_id y scale_id son obligatorios como query params.",
      });
    }

    // 1) Traer la última aplicación
    const appQuery = `
      SELECT *
      FROM scale_application
      WHERE episode_id = $1 AND scale_id = $2
      ORDER BY applied_at DESC, id DESC
      LIMIT 1;
    `;
    const appRes = await pool.query(appQuery, [episode_id, scale_id]);

    if (appRes.rowCount === 0) {
      return res.status(404).json({
        message: "No existe ninguna aplicación para ese episodio y escala.",
      });
    }

    const application = appRes.rows[0];

    // 2) Traer detalle + selecciones + metadata de preguntas/opciones
    const detailQuery = `
      SELECT
        d.id AS detail_id,
        d.scale_application_id,
        d.question_id,
        d.score AS question_score,
        d.answer,
        d.created_at AS detail_created_at,
        q.order_index,
        q.question,
        q.is_multi_select,
        sel.id AS selection_id,
        sel.option_id,
        sel.created_at AS selection_created_at,
        opt.option_text,
        opt.score AS option_score,
        opt.order_index AS option_order_index
      FROM scale_application_detail d
      JOIN scale_question q ON q.id = d.question_id
      LEFT JOIN scale_application_selection sel ON sel.scale_application_detail_id = d.id
      LEFT JOIN scale_question_option opt ON opt.id = sel.option_id
      WHERE d.scale_application_id = $1
      ORDER BY q.order_index ASC, d.id ASC, opt.order_index NULLS LAST, opt.id;
    `;
    const rows = (await pool.query(detailQuery, [application.id])).rows;

    // 3) Armar estructura agrupada
    const detailsMap = new Map(); // detail_id -> object

    for (const r of rows) {
      if (!detailsMap.has(r.detail_id)) {
        detailsMap.set(r.detail_id, {
          id: r.detail_id,
          scale_application_id: r.scale_application_id,
          question_id: r.question_id,
          score: r.question_score,
          answer: r.answer,
          created_at: r.detail_created_at,
          question: {
            id: r.question_id,
            question: r.question,
            order_index: r.order_index,
            is_multi_select: r.is_multi_select,
          },
          selected_options: [],
        });
      }

      if (r.selection_id) {
        detailsMap.get(r.detail_id).selected_options.push({
          id: r.selection_id,
          option_id: r.option_id,
          option_text: r.option_text,
          score: r.option_score,
          order_index: r.option_order_index,
          created_at: r.selection_created_at,
        });
      }
    }

    return res.status(200).json({
      application,
      details: Array.from(detailsMap.values()),
    });
  } catch (error) {
    console.error("Error en getLatestScaleApplication:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

module.exports = { applyScale, getLatestScaleApplication };
