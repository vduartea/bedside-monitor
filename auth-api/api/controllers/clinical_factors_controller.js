const pool = require("../../config/db");

const TABLE_NAME = 'clinical_factors';
const TABLE_SCHEMA = 'public';

/**
 * Obtiene dinámicamente las columnas reales de la tabla.
 */
const getTableColumns = async (client) => {
    const query = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = $2
        ORDER BY ordinal_position
    `;

    const result = await client.query(query, [TABLE_SCHEMA, TABLE_NAME]);
    return result.rows.map(row => row.column_name);
};

/**
 * Filtra solo los campos válidos que existan actualmente en la tabla.
 */
const filterPayloadByColumns = (payload, validColumns) => {
    const filtered = {};

    Object.keys(payload).forEach((key) => {
        if (validColumns.includes(key)) {
            filtered[key] = payload[key];
        }
    });

    return filtered;
};

/**
 * GET /api/clinical-factors/episode/:episodeId
 * Devuelve todos los factores clínicos del episodio,
 * estén activos o no.
 */
const getByEpisodeId = async (req, res) => {
    try {
        const { episodeId } = req.params;

        if (!episodeId || Number.isNaN(Number(episodeId))) {
            return res.status(400).json({
                ok: false,
                message: 'El episodeId es obligatorio y debe ser numérico'
            });
        }

        const query = `
            SELECT *
            FROM ${TABLE_NAME}
            WHERE episode_id = $1
            ORDER BY id ASC
        `;

        const result = await pool.query(query, [Number(episodeId)]);

        return res.status(200).json({
            ok: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error en getByEpisodeId:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * POST /api/clinical-factors
 *
 * Permite crear o actualizar factores clínicos.
 *
 * Reglas:
 * - Si viene "id", actualiza por id.
 * - Si no viene "id", pero existe uno con (episode_id + factor_name), actualiza ese registro.
 * - Si no existe, crea uno nuevo.
 *
 * Acepta:
 * - un objeto
 * - un arreglo de objetos
 *
 * Usa dinámicamente todos los campos reales de la tabla.
 */
const upsert = async (req, res) => {
    const client = await pool.connect();

    try {
        const payload = req.body;
        const items = Array.isArray(payload) ? payload : [payload];

        if (!items.length) {
            return res.status(400).json({
                ok: false,
                message: 'Debe enviar al menos un registro'
            });
        }

        await client.query('BEGIN');

        const validColumns = await getTableColumns(client);
        const results = [];

        for (const rawItem of items) {
            const item = filterPayloadByColumns(rawItem, validColumns);

            if (!item.id && !item.episode_id) {
                throw new Error('Cada registro debe incluir "id" o "episode_id"');
            }

            let existingRecord = null;

            // Buscar por ID
            if (item.id) {
                const existingById = await client.query(
                    `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
                    [item.id]
                );

                if (existingById.rows.length > 0) {
                    existingRecord = existingById.rows[0];
                }
            }

            // Buscar por episode_id + factor_name
            if (!existingRecord && item.episode_id && item.factor_name) {
                const existingByComposite = await client.query(
                    `
                    SELECT *
                    FROM ${TABLE_NAME}
                    WHERE episode_id = $1
                      AND factor_name = $2
                    LIMIT 1
                    `,
                    [item.episode_id, item.factor_name]
                );

                if (existingByComposite.rows.length > 0) {
                    existingRecord = existingByComposite.rows[0];
                }
            }

            // UPDATE
            if (existingRecord) {
                const updateData = { ...item };
                delete updateData.id;

                if (validColumns.includes('updated_at') && updateData.updated_at === undefined) {
                    updateData.updated_at = new Date();
                }

                const updateKeys = Object.keys(updateData);

                if (updateKeys.length === 0) {
                    const current = await client.query(
                        `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
                        [existingRecord.id]
                    );

                    results.push({
                        action: 'none',
                        data: current.rows[0]
                    });

                    continue;
                }

                const setClause = updateKeys
                    .map((key, index) => `${key} = $${index + 1}`)
                    .join(', ');

                const values = updateKeys.map((key) => updateData[key]);
                values.push(existingRecord.id);

                const updateQuery = `
                    UPDATE ${TABLE_NAME}
                    SET ${setClause}
                    WHERE id = $${values.length}
                    RETURNING *
                `;

                const updatedResult = await client.query(updateQuery, values);

                results.push({
                    action: 'updated',
                    data: updatedResult.rows[0]
                });
            } else {
                // INSERT
                const insertData = { ...item };
                delete insertData.id;

                if (validColumns.includes('created_at') && insertData.created_at === undefined) {
                    insertData.created_at = new Date();
                }

                if (validColumns.includes('updated_at') && insertData.updated_at === undefined) {
                    insertData.updated_at = new Date();
                }

                const insertKeys = Object.keys(insertData);

                if (insertKeys.length === 0) {
                    throw new Error('No hay campos válidos para insertar');
                }

                const columnsClause = insertKeys.join(', ');
                const placeholders = insertKeys.map((_, index) => `$${index + 1}`).join(', ');
                const values = insertKeys.map((key) => insertData[key]);

                const insertQuery = `
                    INSERT INTO ${TABLE_NAME} (${columnsClause})
                    VALUES (${placeholders})
                    RETURNING *
                `;

                const insertedResult = await client.query(insertQuery, values);

                results.push({
                    action: 'created',
                    data: insertedResult.rows[0]
                });
            }
        }

        await client.query('COMMIT');

        return res.status(200).json({
            ok: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en upsert:', error);

        return res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getByEpisodeId,
    upsert
};