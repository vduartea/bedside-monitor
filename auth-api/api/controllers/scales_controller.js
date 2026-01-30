const pool = require("../../config/db");

const upsertScaleFull = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id, name, description, version, thresholds, questions } = req.body;

    // ===== Validaciones mínimas =====
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "El campo 'name' es obligatorio." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "El campo 'questions' es obligatorio y debe tener al menos 1 elemento.",
      });
    }

    // Validación preguntas + opciones
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q || typeof q.question !== "string" || !q.question.trim()) {
        return res.status(400).json({ message: `questions[${i}].question es obligatorio.` });
      }

      if (q.order_index === undefined || q.order_index === null) {
        return res.status(400).json({ message: `questions[${i}].order_index es obligatorio.` });
      }

      // is_multi_select default false
      if (q.is_multi_select !== undefined && typeof q.is_multi_select !== "boolean") {
        return res.status(400).json({
          message: `questions[${i}].is_multi_select debe ser boolean.`,
        });
      }

      // options: recomendado (si viene, debe ser array con option_text y score)
      if (q.options !== undefined) {
        if (!Array.isArray(q.options)) {
          return res.status(400).json({
            message: `questions[${i}].options debe ser un array.`,
          });
        }

        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          if (!opt || typeof opt.option_text !== "string" || !opt.option_text.trim()) {
            return res.status(400).json({
              message: `questions[${i}].options[${j}].option_text es obligatorio.`,
            });
          }
          if (opt.score === undefined || opt.score === null || Number.isNaN(Number(opt.score))) {
            return res.status(400).json({
              message: `questions[${i}].options[${j}].score es obligatorio y numérico.`,
            });
          }
          if (opt.order_index !== undefined && opt.order_index !== null && Number.isNaN(Number(opt.order_index))) {
            return res.status(400).json({
              message: `questions[${i}].options[${j}].order_index debe ser numérico si se envía.`,
            });
          }
        }
      }
    }

    await client.query("BEGIN");

    let scaleRow;

    // ========= UPDATE =========
    if (id !== undefined && id !== null) {
      const updateScaleQuery = `
        UPDATE scale
        SET
          name = $1,
          description = $2,
          version = $3,
          thresholds = $4,
          is_active = COALESCE($5, is_active),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *;
      `;

      const updated = await client.query(updateScaleQuery, [
        name.trim(),
        description ?? null,
        version ?? null,
        thresholds ?? null,
        is_active ?? null,
        id,
      ]);

      if (updated.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: `No existe una escala con id=${id}.` });
      }

      scaleRow = updated.rows[0];

      // Reemplazo total de preguntas (y sus opciones).
      // IMPORTANTE: si scale_question_option tiene ON DELETE CASCADE, se borran las opciones automáticamente.
      await client.query(`DELETE FROM scale_question WHERE scale_id = $1;`, [id]);

      // Insert preguntas + opciones
      const insertQuestionQuery = `
        INSERT INTO scale_question (scale_id, question, max_score, order_index, is_multi_select)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;

      const insertOptionQuery = `
        INSERT INTO scale_question_option (question_id, option_text, score, order_index)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;

      const insertedQuestions = [];
      for (const q of questions) {
        const qRes = await client.query(insertQuestionQuery, [
          id,
          q.question.trim(),
          q.max_score ?? null,
          q.order_index,
          q.is_multi_select ?? false,
        ]);

        const insertedQ = qRes.rows[0];
        const options = [];

        if (Array.isArray(q.options) && q.options.length > 0) {
          for (const opt of q.options) {
            const optRes = await client.query(insertOptionQuery, [
              insertedQ.id,
              opt.option_text.trim(),
              Number(opt.score),
              opt.order_index ?? null,
            ]);
            options.push(optRes.rows[0]);
          }
        }

        insertedQuestions.push({ ...insertedQ, options });
      }

      await client.query("COMMIT");

      return res.status(200).json({
        message: "Escala actualizada correctamente",
        scale: scaleRow,
        questions: insertedQuestions,
      });
    }

    // ========= CREATE =========
    const insertScaleQuery = `
      INSERT INTO scale (name, description, version, thresholds, is_active)
      VALUES ($1, $2, $3, $4, COALESCE($5, FALSE))
      RETURNING *;
    `;

    const created = await client.query(insertScaleQuery, [
      name.trim(),
      description ?? null,
      version ?? null,
      thresholds ?? null,
      is_active ?? null,
    ]);

    scaleRow = created.rows[0];

    const insertQuestionQuery = `
      INSERT INTO scale_question (scale_id, question, max_score, order_index, is_multi_select)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const insertOptionQuery = `
      INSERT INTO scale_question_option (question_id, option_text, score, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const insertedQuestions = [];
    for (const q of questions) {
      const qRes = await client.query(insertQuestionQuery, [
        scaleRow.id,
        q.question.trim(),
        q.max_score ?? null,
        q.order_index,
        q.is_multi_select ?? false,
      ]);

      const insertedQ = qRes.rows[0];
      const options = [];

      if (Array.isArray(q.options) && q.options.length > 0) {
        for (const opt of q.options) {
          const optRes = await client.query(insertOptionQuery, [
            insertedQ.id,
            opt.option_text.trim(),
            Number(opt.score),
            opt.order_index ?? null,
          ]);
          options.push(optRes.rows[0]);
        }
      }

      insertedQuestions.push({ ...insertedQ, options: insertedOptions });
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Escala creada correctamente",
      scale: scaleRow,
      questions: insertedQuestions,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    console.error("Error en upsertScaleFull:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const getAllScalesFull = async (req, res) => {
  try {
    const query = `
      SELECT
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sq.id,
              'scale_id', sq.scale_id,
              'question', sq.question,
              'max_score', sq.max_score,
              'order_index', sq.order_index,
              'is_multi_select', sq.is_multi_select,
              'created_at', sq.created_at,
              'options', COALESCE((
                SELECT json_agg(
                  json_build_object(
                    'id', so.id,
                    'question_id', so.question_id,
                    'option_text', so.option_text,
                    'score', so.score,
                    'order_index', so.order_index,
                    'created_at', so.created_at
                  )
                  ORDER BY so.order_index NULLS LAST, so.id
                )
                FROM scale_question_option so
                WHERE so.question_id = sq.id
              ), '[]'::json)
            )
            ORDER BY sq.order_index
          ) FILTER (WHERE sq.id IS NOT NULL),
          '[]'::json
        ) AS questions
      FROM scale s
      LEFT JOIN scale_question sq ON sq.scale_id = s.id
      GROUP BY s.id
      ORDER BY s.id;
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      count: result.rowCount,
      scales: result.rows,
    });
  } catch (error) {
    console.error("Error en getAllScalesFull:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

module.exports = { upsertScaleFull, getAllScalesFull };
