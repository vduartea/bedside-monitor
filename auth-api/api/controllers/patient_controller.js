const db = require('../../config/db');

// ---------------------------------------------------------
// API 1: Registrar Paciente + Episodio
// ---------------------------------------------------------
exports.registerPatientAndEpisode = async (req, res) => {
  try {
    const { patient, episode } = req.body;

    // ----------------------------------------
    // 1. Insertar paciente
    // ----------------------------------------
    const insertPatientQuery = `
      INSERT INTO patient (
        names, surname1, surname2, birthdate,
        sexType, docType, pinNumber
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;

    const patientResult = await db.query(insertPatientQuery, [
      patient.names,
      patient.surname1,
      patient.surname2 || null,
      patient.birthdate,
      patient.sexType,
      patient.docType,
      patient.pinNumber
    ]);

    const patientId = patientResult.rows[0].id;

    // ----------------------------------------
    // 2. Insertar episodio
    // ----------------------------------------
    const insertEpisodeQuery = `
      INSERT INTO episode (
        patient_id, bed_id, admission_datetime,
        admission_diagnosis, is_intubated, is_sedated
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;

    const episodeResult = await db.query(insertEpisodeQuery, [
      patientId,
      episode.bed_id || null,
      episode.admission_datetime,
      episode.admission_diagnosis,
      episode.is_intubated || false,
      episode.is_sedated || false
    ]);

    return res.status(201).json({
      message: "Patient and episode registered successfully",
      patient_id: patientId,
      episode_id: episodeResult.rows[0].id
    });

  } catch (error) {
    console.error("Error registerPatientAndEpisode:", error);
    res.status(500).json({ message: "Error registering patient and episode" });
  }
};


// ---------------------------------------------------------
// API 2: Actualizar Paciente + Episodio
// ---------------------------------------------------------
exports.updatePatientAndEpisode = async (req, res) => {
  try {
    const { patient_id, episode_id, patient, episode } = req.body;

    if (!patient_id && !episode_id) {
      return res.status(400).json({
        message: "Debe enviar al menos patient_id o episode_id"
      });
    }

    // ----------------------------------------
    // 1. Cargar datos actuales
    // ----------------------------------------
    let currentPatient = null;
    let currentEpisode = null;

    if (patient_id) {
      const p = await db.query("SELECT * FROM patient WHERE id = $1", [patient_id]);
      if (p.rows.length === 0) {
        return res.status(404).json({ message: "Patient not found" });
      }
      currentPatient = p.rows[0];
    }

    if (episode_id) {
      const e = await db.query(
        "SELECT * FROM episode WHERE id = $1",
        [episode_id]
      );
      if (e.rows.length === 0) {
        return res.status(404).json({ message: "Episode not found" });
      }
      // Si viene patient_id, validamos que pertenezca al mismo paciente
      if (patient_id && e.rows[0].patient_id !== patient_id) {
        return res.status(400).json({
          message: "Episode does not belong to the provided patient_id"
        });
      }
      currentEpisode = e.rows[0];
    }

    // ----------------------------------------
    // 2. Preparar datos de paciente a actualizar
    // ----------------------------------------
    if (currentPatient && patient) {
      // Campos bloqueados
      // id, created_at, docType, pinNumber NO se tocan
      const mergedPatient = {
        names:       patient.names       ?? currentPatient.names,
        surname1:    patient.surname1    ?? currentPatient.surname1,
        surname2:    patient.surname2    ?? currentPatient.surname2,
        birthdate:   patient.birthdate   ?? currentPatient.birthdate,
        sexType: (patient?.sexType !== undefined && patient?.sexType !== null) ? patient.sexType  : currentPatient.sextype,
        // docType y pinNumber NO se actualizan
      };

      const updatePatientQuery = `
        UPDATE patient
        SET
          names = $1,
          surname1 = $2,
          surname2 = $3,
          birthdate = $4,
          sexType = $5,
          updated_at = NOW()
        WHERE id = $6;
      `;

      await db.query(updatePatientQuery, [
        mergedPatient.names,
        mergedPatient.surname1,
        mergedPatient.surname2,
        mergedPatient.birthdate,
        mergedPatient.sexType,
        patient_id
      ]);
    }

    // ----------------------------------------
    // 3. Preparar datos de episodio a actualizar
    // ----------------------------------------
    if (currentEpisode && episode) {
      // Campos bloqueados:
      // id, patient_id, created_at, admission_datetime NO se tocan
      const mergedEpisode = {
        bed_id:              episode.bed_id              ?? currentEpisode.bed_id,
        discharge_datetime:  episode.discharge_datetime  ?? currentEpisode.discharge_datetime,
        admission_diagnosis: episode.admission_diagnosis ?? currentEpisode.admission_diagnosis,
        is_intubated:        episode.is_intubated        ?? currentEpisode.is_intubated,
        is_sedated:          episode.is_sedated          ?? currentEpisode.is_sedated
      };

      const updateEpisodeQuery = `
        UPDATE episode
        SET
          bed_id = $1,
          discharge_datetime = $2,
          admission_diagnosis = $3,
          is_intubated = $4,
          is_sedated = $5,
          updated_at = NOW()
        WHERE id = $6;
      `;

      await db.query(updateEpisodeQuery, [
        mergedEpisode.bed_id,
        mergedEpisode.discharge_datetime,
        mergedEpisode.admission_diagnosis,
        mergedEpisode.is_intubated,
        mergedEpisode.is_sedated,
        episode_id
      ]);
    }

    return res.json({
      message: "Patient and episode updated successfully"
    });

  } catch (error) {
    console.error("Error updatePatientAndEpisode:", error);
    res.status(500).json({ message: "Error updating patient and episode" });
  }
};
