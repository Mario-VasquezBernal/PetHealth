// ========================================
// CONFIGURACIÓN
// ========================================
const API_URL = 'http://localhost:5000';

// ========================================
// AUTENTICACIÓN
// ========================================
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
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
    body: JSON.stringify(credentials)
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
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener perfil');
  return response.json();
};

export const updateUserProfile = async (userData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
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
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener mascotas');
  return response.json();
};

export const getPetById = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/pets/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener mascota');
  return response.json();
};

export const addPetToStorage = async (petData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/pets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(petData)
  });
  
  if (!response.ok) throw new Error('Error al agregar mascota');
  return response.json();
};

export const updatePet = async (id, petData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/pets/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(petData)
  });
  
  if (!response.ok) throw new Error('Error al actualizar mascota');
  return response.json();
};

export const deletePetFromStorage = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/pets/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al eliminar mascota');
  return response.json();
};

// ========================================
// CITAS
// ========================================
export const getAppointments = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/appointments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener citas');
  return response.json();
};

export const createAppointment = async (appointmentData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appointmentData)
  });
  
  if (!response.ok) throw new Error('Error al crear cita');
  return response.json();
};

export const updateAppointment = async (id, appointmentData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appointmentData)
  });
  
  if (!response.ok) throw new Error('Error al actualizar cita');
  return response.json();
};

export const deleteAppointment = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
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
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener veterinarios');
  return response.json();
};

export const createVeterinarian = async (vetData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/vet`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(vetData)
  });
  
  if (!response.ok) throw new Error('Error al crear veterinario');
  return response.json();
};

export const updateVeterinarian = async (id, vetData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/vet/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(vetData)
  });
  
  if (!response.ok) throw new Error('Error al actualizar veterinario');
  return response.json();
};

export const deleteVeterinarian = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/vet/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
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
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener clínicas');
  return response.json();
};

export const createClinic = async (clinicData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/clinics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clinicData)
  });
  
  if (!response.ok) throw new Error('Error al crear clínica');
  return response.json();
};

export const updateClinic = async (id, clinicData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/clinics/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clinicData)
  });
  
  if (!response.ok) throw new Error('Error al actualizar clínica');
  return response.json();
};

export const deleteClinic = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/clinics/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
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
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener tareas');
  return response.json();
};

export const createTask = async (taskData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });
  
  if (!response.ok) throw new Error('Error al crear tarea');
  return response.json();
};

export const updateTask = async (id, taskData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });
  
  if (!response.ok) throw new Error('Error al actualizar tarea');
  return response.json();
};

export const deleteTask = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al eliminar tarea');
  return response.json();
};

// ========================================
// 🆕 SISTEMA QR Y REGISTROS MÉDICOS
// ========================================

// Generar código QR para una mascota
export const generateQRCode = async (petId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/qr/generate/${petId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al generar código QR');
  }
  
  return response.json();
};

// Validar token QR (público, sin auth)
export const validateQRToken = async (token) => {
  const response = await fetch(`${API_URL}/qr/validate/${token}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Token inválido o expirado');
  }
  
  return response.json();
};

// Crear registro médico (público con token QR)
export const createMedicalRecord = async (recordData) => {
  const response = await fetch(`${API_URL}/medical-records/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(recordData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear registro médico');
  }
  
  return response.json();
};

// Obtener historial médico de una mascota
export const getMedicalRecords = async (petId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/medical-records/pet/${petId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener historial médico');
  }
  
  return response.json();
};
