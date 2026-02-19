// ============================================
// DATAMANAGER.JS
// ============================================
// Capa de abstracción para todas las llamadas HTTP a la API backend
// Centraliza la lógica de comunicación con el servidor
// Maneja autenticación mediante tokens JWT en localStorage
// URL base configurable mediante variable de entorno (VITE_API_URL)
//
// SECCIONES:
//
// 1. AUTENTICACIÓN
//    - registerUser: Crea cuenta nueva (retorna token)
//    - loginUser: Inicia sesión (retorna token)
//    - getUserProfile: Obtiene datos del usuario autenticado
//    - updateUserProfile: Actualiza perfil de usuario
//
// 2. MASCOTAS (Pets)
//    - getPets: Lista todas las mascotas del usuario
//    - getPetById: Obtiene una mascota específica (con opción skipCache)
//    - addPetToStorage: Crea nueva mascota
//    - updatePet: Actualiza datos de mascota
//    - deletePetFromStorage: Elimina mascota
//
// 3. CITAS (Appointments)
//    - getAppointments: Lista citas del usuario
//    - createAppointment: Crea nueva cita
//    - updateAppointment: Modifica cita existente
//    - deleteAppointment: Cancela cita
//
// 4. VETERINARIOS (Veterinarians)
//    - getVeterinarians: Lista veterinarios
//    - createVeterinarian: Registra nuevo veterinario
//    - updateVeterinarian: Actualiza datos de veterinario
//    - deleteVeterinarian: Elimina veterinario
//
// 5. CLÍNICAS (Clinics)
//    - getClinics: Lista clínicas
//    - createClinic: Registra nueva clínica
//    - updateClinic: Actualiza clínica
//    - deleteClinic: Elimina clínica
//
// 6. TAREAS (Tasks) - Sistema de recordatorios
//    - getTasks: Lista tareas pendientes
//    - createTask: Crea nueva tarea
//    - updateTask: Actualiza tarea
//    - deleteTask: Elimina tarea
//
// 7. SISTEMA QR Y REGISTROS MÉDICOS
//    - generateQRCode: Genera token QR temporal para mascota (24h) - ✅ ACTUALIZADO
//    - validateQRToken: Valida token QR (público, sin auth)
//    - createMedicalRecord: Crea registro médico (público con token)
//    - getMedicalRecords: Obtiene historial médico de mascota
//
// AUTENTICACIÓN:
// - Funciones protegidas incluyen header: Authorization: Bearer <token>
// - Token JWT almacenado en localStorage
// - Funciones QR públicas no requieren token de usuario
//
// MANEJO DE ERRORES:
// - Lanza Error con mensaje descriptivo si response.ok === false
// - Componentes capturan errores y muestran toasts al usuario
// ============================================



//const API_URL = import.meta.env.VITE_API_URL || 'https://pethealth-production.up.railway.app'; ORIGINAL 
const API_URL = 'https://pethealth-production.up.railway.app';
//const API_URL = 'https://httpbin.org';



// ========================================
// AUTENTICACIÓN
// ========================================
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al registrar usuario');
  }

  return response.json();
};


export const loginUser = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al iniciar sesión');
  }

  return response.json();
};


export const getUserProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al obtener perfil');
  return response.json();
};


export const updateUserProfile = async (userData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar perfil');
  }

  return response.json();
};



// ========================================
// MASCOTAS
// ========================================
export const getPets = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/pets`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al obtener mascotas');
  return response.json();
};


export const getPetById = async (id, skipCache = false) => {
  const token = localStorage.getItem('token');

  const url = skipCache
    ? `${API_URL}/auth/pets/${id}?t=${Date.now()}`
    : `${API_URL}/auth/pets/${id}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) throw new Error('Error al obtener mascota');
  return response.json();
};


export const addPetToStorage = async (petData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/pets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(petData),
  });

  if (!response.ok) throw new Error('Error al agregar mascota');
  return response.json();
};


export const updatePet = async (id, petData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/pets/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(petData),
  });

  if (!response.ok) throw new Error('Error al actualizar mascota');
  return response.json();
};


export const deletePetFromStorage = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/pets/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al eliminar mascota');
  return response.json();
};



// ========================================
// CITAS
// ========================================
export const getAppointments = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/appointments?t=${Date.now()}`, { // ✅ CAMBIO: fuerza sin caché igual que getPetById
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache', // ✅ CAMBIO: evita respuesta cacheada de Railway
    },
  });

  if (!response.ok) throw new Error('Error al obtener citas');
  return response.json();
};


export const createAppointment = async (appointmentData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(appointmentData),
  });

  if (!response.ok) throw new Error('Error al crear cita');
  return response.json();
};


export const updateAppointment = async (id, appointmentData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(appointmentData),
  });

  if (!response.ok) throw new Error('Error al actualizar cita');
  return response.json();
};


export const deleteAppointment = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al eliminar cita');
  return response.json();
};



// ========================================
// VETERINARIOS
// ========================================
export const getVeterinarians = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/vet`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al obtener veterinarios');
  return response.json();
};


export const createVeterinarian = async (vetData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/vet`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vetData),
  });

  if (!response.ok) throw new Error('Error al crear veterinario');
  return response.json();
};


export const updateVeterinarian = async (id, vetData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/vet/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vetData),
  });

  if (!response.ok) throw new Error('Error al actualizar veterinario');
  return response.json();
};


export const deleteVeterinarian = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/vet/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al eliminar veterinario');
  return response.json();
};



// ========================================
// CLÍNICAS
// ========================================
export const getClinics = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/clinics`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al obtener clínicas');
  return response.json();
};


export const createClinic = async (clinicData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/clinics`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(clinicData),
  });

  if (!response.ok) throw new Error('Error al crear clínica');
  return response.json();
};


export const updateClinic = async (id, clinicData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/clinics/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(clinicData),
  });

  if (!response.ok) throw new Error('Error al actualizar clínica');
  return response.json();
};


export const deleteClinic = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/clinics/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al eliminar clínica');
  return response.json();
};



// ========================================
// TAREAS
// ========================================
export const getTasks = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al obtener tareas');
  return response.json();
};


export const createTask = async (taskData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) throw new Error('Error al crear tarea');
  return response.json();
};


export const updateTask = async (id, taskData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) throw new Error('Error al actualizar tarea');
  return response.json();
};


export const deleteTask = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Error al eliminar tarea');
  return response.json();
};



// ========================================
// SISTEMA QR Y REGISTROS MÉDICOS
// ========================================

export const generateQRCode = async (petId, { vetId, clinicId }) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/qr/generate/${petId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vetId, clinicId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al generar código QR');
  }

  return response.json();
};


export const validateQRToken = async (token) => {
  // Ruta original en /qr/validate/:token — NO mover a /api/public
  const response = await fetch(`${API_URL}/qr/validate/${token}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Token inválido o expirado');
  }

  return response.json();
};


export const createMedicalRecord = async (recordData) => {
  // ✅ CAMBIO: Campos renombrados para coincidir con public.routes.js
  // measured_weight → recorded_weight | follow_up_date → next_visit
  const {
    token,
    diagnosis,
    treatment,
    notes,
    measured_weight,   // viene de VetQRAccess
    vet_id: _vet_id,
    clinic_id,
    visit_reason,
    examination_findings,
    follow_up_date,    // viene de VetQRAccess
    visit_type
  } = recordData;

  const response = await fetch(`${API_URL}/api/public/medical-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,                              // para que el servidor resuelva pet_id
      diagnosis,
      treatment,
      notes: notes
        ? `${notes}${visit_reason ? `\nMotivo: ${visit_reason}` : ''}${examination_findings ? `\nHallazgos: ${examination_findings}` : ''}`
        : `${visit_reason ? `Motivo: ${visit_reason}` : ''}${examination_findings ? `\nHallazgos: ${examination_findings}` : ''}`,
      recorded_weight: measured_weight,  // ✅ nombre correcto para el servidor
      next_visit: follow_up_date,        // ✅ nombre correcto para el servidor
      visit_type,
      clinic_id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear registro médico');
  }

  return response.json();
};


export const getMedicalRecords = async (petId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/medical-records/pet/${petId}?t=${Date.now()}`, { // ✅ CAMBIO: fuerza sin caché para que el peso nuevo siempre se refleje
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache', // ✅ CAMBIO: evita que Railway devuelva el historial cacheado
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener historial médico');
  }

  return response.json();
};
