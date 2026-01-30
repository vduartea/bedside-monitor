require('dotenv').config();
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const express = require('express');
const cors = require('cors');

const authRoutes = require('./api/routes/auth');
const usersRoutes = require('./api/routes/users');
const bedsRoutes = require('./api/routes/beds');
const patientRoutes = require('./api/routes/patient');
const scalesRoutes = require('./api/routes/scales');
const scaleApplication = require('./api/routes/scaleApplications');
const episodesRoutes = require("./api/routes/episodes");

const app = express();
app.use(cors());
app.use(express.json());

// Rutas reales
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use("/api/beds", bedsRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/scales", scalesRoutes);
app.use("/api/scaleApplications", scaleApplication);
app.use("/api/episodes", episodesRoutes);

// DOCUMENTACIÓN MANUAL
const rutasDisponibles = [
  {
    path: "/api/auth/login",
    description: "Inicio de sesión",
    method: "POST",
    bodyExample: JSON.stringify({ email: "user@test.com", password: "123456" }, null, 2),
    rules: [
      "El email debe existir",
      "La contraseña debe ser correcta",
      "Devuelve token JWT"
    ],
    responseExample: JSON.stringify({ token: "xxxx.yyyy.zzzz" }, null, 2)
  },
  {
    path: "/api/auth/register",
    description: "Registro de usuario",
    method: "POST",
    bodyExample: JSON.stringify({ "nombres": "Juan Carlos", "apellido1": "Martinez", "apellido2": "Lopez", "email": "new@test.com", "rol": "Admin", "password": "123456" }, null, 2),
    rules: [
      "El email no debe existir antes",
      "Contraseña mínima 6 caracteres",
      "Los roles disponibles son: Admin, Médico, Enfermera, TENS"
    ],
    responseExample: JSON.stringify({ message: "Usuario registrado correctamente" }, null, 2)
  },
  {
    path: "/api/users",
    description: "Obtención de usuarios",
    method: "GET",
    bodyExample: "N/A",
    rules: ["Debe tener autorización con token"],
    responseExample: JSON.stringify([{ "message": "Lista de usuarios obtenida correctamente", "total": 1, "users": [{"id": 3,"nombres": "Juan Carlos", "apellido1": "Martinez", "apellido2": "Lopez", "email": "new@test.com", "rol": "Admin", "created_at": "2025-12-03T23:25:10.836Z"        }] }], null, 2)
  },
  {
    path: "/api/beds",
    description: "Obtención de camas",
    method: "GET",
    bodyExample: "N/A",
    rules: ["N/A"],
    responseExample: JSON.stringify([{ "message": "Lista de camas obtenida correctamente","total": 2, "beds": [ { "id": 1, "code": "C-101", "service": "UTI", "specialty": "Pediatría 2", "status": "Libre", "location": "Habitación 1","created_at": "2025-12-09T16:11:52.522Z", "updated_at": "2025-12-09T20:06:27.324Z" }] }], null, 2)
  },
  {
    path: "/api/beds",
    description: "Crea o actualiza camas",
    method: "POST",
    bodyExample: JSON.stringify({ "id": 3,"code": "C-103","service": "UTI","specialty": "Pediatría 3", "status": "Libre", "location": "Habitación 3", "created_at": "2025-12-09T19:11:52.522Z", "updated_at": "2025-12-09T20:11:52.522Z" }, null, 2),
    rules: [
      "Para crear una nueva, no enviar parametro id",
      "Para actualizar una cama, se debe agregar id existente",
      "Los estados disponibles son: 'Libre', 'Ocupada', 'Mantenimiento'"
    ],
    responseExample: JSON.stringify({ message: "Cama actualizada" }, null, 2)
  },
  {
    path: "/api/patient/register",
    description: "Registrar paciente",
    method: "POST",
    bodyExample: JSON.stringify({ "patient": {"names": "María Fernanda", "surname1": "González", "surname2": "Ramírez", "birthdate": "1992-08-14", "sexType": "F", "docType": "RUT", "pinNumber": "11.111.111-1"}, "episode": {"bed_id": 2,"admission_datetime": "2025-02-18T10:30:00","admission_diagnosis": "Neumonía bacteriana","is_intubated": true,"is_sedated": false} }, null, 2),
    rules: ["Los campos obligatorios son: names, surname1, birthdate, sexType, docType, pinNumber, created_at, bed_id, admission_datetime, admission_diagnosis"],
    responseExample: JSON.stringify({ "message": "Patient and episode registered successfully", "patient_id": 10, "episode_id": 8 }, null, 2)
  },
  {
    path: "/api/patient/update",
    description: "Actualizar paciente",
    method: "POST",
    bodyExample: JSON.stringify({ "patient_id": 10, "episode_id": 8, "patient": { "names": "María Fernandas", "surname1": "Gonzálezz", "surname2": "Ramírez", "birthdate": "1992-08-14", "sexType": "F", "docType": "RUT", "pinNumber": "11.111.111-1"},  "episode": {"bed_id": 1, "admission_datetime": "2025-02-18T10:30:00","admission_diagnosis": "Neumonía bacteriana en mejoría", "is_intubated": false,"is_sedated": false} }, null, 2),
    rules: [
      "El id del paciente debe existir",
      "El id del episodio debe",
      "Se puede actualizar todos los campos excepto: Id paciente, Id episodio, docType, pinNumber, created_at, patient_id, admission_datetime. "

    ],
    responseExample: JSON.stringify({ message: "Patient and episode updated successfully" }, null, 2)
  },
  {
    path: "/api/scales",
    description: "Lista las escalas creadas en BBDD",
    method: "GET",
    bodyExample: "N/A",
    rules: ["N/A" ],
    responseExample: JSON.stringify({ "count":1,"scales":[{"id":1,"name":"Morse Fall Scale","description":"Escala clínica para evaluar riesgo de caídas en pacientes hospitalizados.","version":"1.0","is_active": false,"thresholds":{"low":{"max":24,"min":0,"label":"Low risk"},"high":{"min":45,"label":"High risk"},"medium":{"max":44,"min":25,"label":"Moderate risk"}},"created_at":"2025-12-10T16:24:49.817Z","updated_at":"2025-12-10T16:24:49.817Z","questions":[{"id":1,"scale_id":1,"question":"History of falling (immediate or within 3 months)","max_score":25,"order_index":1,"created_at":"2025-12-10T13:27:36.698962"},{"id":2,"scale_id":1,"question":"Secondary diagnosis","max_score":15,"order_index":2,"created_at":"2025-12-10T13:27:36.698962"},{"id":3,"scale_id":1,"question":"Ambulatory aid (none, cane/crutch, furniture)","max_score":30,"order_index":3,"created_at":"2025-12-10T13:27:36.698962"},{"id":4,"scale_id":1,"question":"IV therapy / heparin lock","max_score":20,"order_index":4,"created_at":"2025-12-10T13:27:36.698962"},{"id":5,"scale_id":1,"question":"Gait / transferring","max_score":20,"order_index":5,"created_at":"2025-12-10T13:27:36.698962"},{"id":6,"scale_id":1,"question":"Mental status","max_score":15,"order_index":6,"created_at":"2025-12-10T13:27:36.698962"}]}] }, null, 2)
  },
  {
    path: "/api/scales",
    description: "Crear o Actualizar escalas clinicas",
    method: "POST",
    bodyExample: JSON.stringify({"name": "Escala de Downton","description": "Escala clínica para evaluar el riesgo de caídas en pacientes hospitalizados. Considera antecedentes, medicación, déficits sensoriales, estado mental y deambulación.","version": "1.0","is_active": false,"thresholds": {"low_risk": {"min": 0,"max": 2},"high_risk": {"min": 3,"max": 11}},"questions": [{"question": "Antecedentes de caídas previas","max_score": 1,"order_index": 1,"is_multi_select": false,"options": [{"option_text": "No","score": 0,"order_index": 1},{"option_text": "Sí","score": 1,"order_index": 2}]},{"question": "Medicación (seleccione todas las que correspondan)","max_score": 5,"order_index": 2,"is_multi_select": true,"options": [{"option_text": "Tranquilizantes / sedantes","score": 1,"order_index": 1},{"option_text": "Diuréticos","score": 1,"order_index": 2},{"option_text": "Antihipertensivos","score": 1,"order_index": 3},{"option_text": "Antiparkinsonianos","score": 1,"order_index": 4},{"option_text": "Antidepresivos","score": 1,"order_index": 5}]},{"question": "Déficits sensoriales (seleccione todas las que correspondan)","max_score": 3,"order_index": 3,"is_multi_select": true,"options": [{"option_text": "Alteración visual","score": 1,"order_index": 1},{"option_text": "Alteración auditiva","score": 1,"order_index": 2},{"option_text": "Alteración de extremidades","score": 1,"order_index": 3}]},{"question": "Estado mental","max_score": 1,"order_index": 4,"is_multi_select": false,"options": [{"option_text": "Orientado","score": 0,"order_index": 1},{"option_text": "Confuso / desorientado","score": 1,"order_index": 2}]},{"question": "Deambulación (seleccione todas las que correspondan)","max_score": 3,"order_index": 5,"is_multi_select": true,"options": [{"option_text": "Normal / segura","score": 0,"order_index": 1},{"option_text": "Necesita ayuda","score": 1,"order_index": 2},{ "option_text": "Marcha insegura","score": 1,"order_index": 3},{"option_text": "No deambula","score": 1, "order_index": 4 }]}  ]}, null, 2),
    rules: [
      "Para Actualizar una escala existente se debe enviar el ID de la escala",
      "Se puede actualizar todos los campos excepto los de control como: Id, created_at, patient_id, admission_datetime. "

    ],
    responseExample: JSON.stringify({ message: "Patient and episode updated successfully" }, null, 2)
  },
  {
    path: "/api/scaleApplications",
    description: "Registra la aplicación de una escala en un paciente con episodio activo",
    method: "POST",
    bodyExample: JSON.stringify({"episode_id": 8,"scale_id": 2,"applied_by": 6,"result_detail": {"risk_level": "high_risk","scale_name": "Escala de Downton"},"details": [{"question_id": 7,"selected_option_ids": [2]},{"question_id": 8,"selected_option_ids": [3, 7]},{"question_id": 9,"selected_option_ids": [8, 10]},{"question_id": 10,"selected_option_ids": [12]},{"question_id": 11,"selected_option_ids": [15]}  ]}, null, 2),
    rules: [
      "Solo se permite registrar aplicaciones de escalas",
      "Se debe enviar el ID de episodio, el ID de la escala y el ID del usuario que la aplica "

    ],
    responseExample: JSON.stringify({ message: "Patient and episode updated successfully" }, null, 2)
  },
  {
    path: "/api/scaleApplication/latest",
    description: "Entrega la aplicacion de escala más reciente",
    method: "GET",
    bodyExample: "N/A",
    rules: [
      "Se debe enviar el ID de episodio",
      "Se debe enviar el ID de la escala",
      "Ejemplo: http://localhost:3000/api/scaleApplications/latest?episode_id=8&scale_id=2"

    ],
    responseExample: JSON.stringify({ message: "Patient and episode updated successfully" }, null, 2)
  },
  {
    path: "/api/episodes",
    description: "Entrega los episodios activos que están registrados",
    method: "GET",
    bodyExample: "N/A",
    rules: ["Debe tener autorización con token"],
    responseExample: JSON.stringify([{    "message": "Episodios activos obtenidos correctamente",    "total": 7,    "episodes": [        {            "episode": {                "id": 14,                "bed_id": 1,                "created_at": "2025-12-29T12:44:18.109725",                "is_sedated": true,                "patient_id": 16,                "updated_at": "2025-12-29T12:44:18.109725",                "is_intubated": false,                "admission_datetime": "2025-12-29T09:44:00",                "discharge_datetime": null,                "admission_diagnosis": "Prueba"            },            "patient": {                "id": 16,                "names": "Franco",                "doctype": "RUT",                "sextype": "M",                "surname1": "Lopez",                "surname2": "Estrada",                "birthdate": "2004-07-15",                "pinnumber": "19068910-7",                "created_at": "2025-12-29T12:44:18.071182",                "updated_at": "2025-12-29T12:44:18.071182"            },            "bed": {                "id": 1,                "code": "C-101",                "status": "Libre",                "service": "UCI",                "location": "Habitación 4",                "specialty": "Pediatría 2",                "created_at": "2025-12-09T16:11:52.5226",                "updated_at": "2025-12-30T12:35:34.308351"            },            "latest_scales": []        }]}], null, 2)
  }
];

// HTML DOCUMENTATION PAGE
app.get('/', (req, res) => {

  let html = `
  <html>
  <head>
    <title>Documentación API</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      h1 { color: #333; }
      .api-list { margin-bottom: 30px; }
      .api-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
      pre { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
      .method { font-weight: bold; color: white; padding: 4px 8px; border-radius: 5px; }
      .POST { background-color: #007bff; }
      .GET { background-color: green; }
      .PUT { background-color: orange; }
      .DELETE { background-color: red; }
    </style>
  </head>
  <body>

    <h1>API funcionando correctamente 🚀</h1>
    <h2>Lista de APIs disponibles</h2>
    <ul class="api-list">
  `;

  rutasDisponibles.forEach(api => {
    html += `<li><strong>${api.path}</strong> — ${api.description}</li>`;
  });

  html += `</ul><h2>Detalle de cada API</h2>`;

  rutasDisponibles.forEach(api => {
    html += `
      <div class="api-card">
        <h3>${api.path}</h3>
        <span class="method ${api.method}">${api.method}</span>
        <p>${api.description}</p>

        <h4>JSON de envío:</h4>
        <pre>${api.bodyExample}</pre>

        <h4>Reglas:</h4>
        <ul>
          ${api.rules.map(r => `<li>${r}</li>`).join("")}
        </ul>

        <h4>Respuesta esperada:</h4>
        <pre>${api.responseExample}</pre>
      </div>
    `;
  });

  html += `
  </body></html>
  `;

  res.send(html);
});


// Initialize server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});





/*
const rutasDisponibles = [
  { path: "/api/auth/login", description: "Autenticación y sesiones" },
  { path: "/api/auth/register", description: "Autenticación y sesiones" },
  { path: "/api/users", description: "Usuarios del sistema" },
  { path: "/api/beds", description: "Crea o actualiza las Camas" },
  { path: "/api/patient/register", description: "Pacientes" },
  { path: "/api/patient/update", description: "Pacientes" }
];
*/
