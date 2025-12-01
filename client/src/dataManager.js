const API_BASE = 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', 'token': token };
};

// --- AUTH ---
export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data);
  return data;
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data === 'string' ? data : 'Error');
  return data;
};

export const getUserProfile = async () => {
  const response = await fetch(`${API_BASE}/auth/profile`, { headers: getHeaders() });
  if (!response.ok) return null;
  return await response.json();
};

export const updateUserProfile = async (userData) => {
  const response = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });
  return await response.json();
};

// --- CLÍNICAS Y VETERINARIOS ---

// FUNCIÓN PARA OBTENER CLÍNICAS
export const getClinics = async () => {
    const response = await fetch(`${API_BASE}/clinics`, { headers: getHeaders() });
    return await response.json();
};

// FUNCIÓN PARA CREAR CLÍNICA (REQUERIDA POR EL MODAL)
export const createClinic = async (clinicData) => {
    const response = await fetch(`${API_BASE}/clinics`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(clinicData)
    });
    return await response.json();
};

export const getVets = async () => {
  const response = await fetch(`${API_BASE}/appointments/vets`, { headers: getHeaders() });
  return await response.json();
};

export const createVet = async (vetData) => {
  const response = await fetch(`${API_BASE}/appointments/vets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(vetData)
  });
  return await response.json();
};
// En dataManager.js

export const deleteClinic = async (id) => {
    // Asumimos que tu backend recibe peticiones DELETE en /clinics/ID
    await fetch(`${API_BASE}/clinics/${id}`, { 
        method: 'DELETE', 
        headers: getHeaders() 
    });
    return await getClinics(); // Devolvemos la lista actualizada
};
// --- MASCOTAS Y CITAS ---
export const getPets = async () => {
  const response = await fetch(`${API_BASE}/vet`, { headers: getHeaders() });
  if (response.status === 403) { localStorage.removeItem('token'); return []; }
  return await response.json();
};

export const getPetById = async (id) => {
  const response = await fetch(`${API_BASE}/vet/${id}`, { headers: getHeaders() });
  if (!response.ok) return null;
  return await response.json();
};

export const addPetToStorage = async (newPet) => {
  const response = await fetch(`${API_BASE}/vet`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(newPet)
  });
  return await response.json();
};

export const addMedicalRecord = async (petId, record) => {
  const response = await fetch(`${API_BASE}/vet/${petId}/record`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(record)
  });
  return await response.json();
};

export const deletePetFromStorage = async (id) => {
  await fetch(`${API_BASE}/vet/${id}`, { method: 'DELETE', headers: getHeaders() });
  return await getPets();
};

export const getAppointments = async () => {
  const response = await fetch(`${API_BASE}/appointments`, { headers: getHeaders() });
  return await response.json();
};

export const createAppointment = async (apptData) => {
  const response = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(apptData)
  });
  return await response.json();
};

export const deleteAppointment = async (id) => {
  await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE', headers: getHeaders() });
  return await getAppointments();
};
export const deleteVet = async (id) => {
    const response = await fetch(`${API_BASE}/appointments/vets/${id}`, { 
        method: 'DELETE', 
        headers: getHeaders() 
    });
    
    // Si el servidor responde con error (ej: 404 o 500), lanzamos una alerta real
    if (!response.ok) throw new Error("Error al eliminar veterinario");

    return await getVets();
};
// En src/dataManager.js

// Obtener historial médico
export const getMedicalHistory = async (petId) => {
    const response = await fetch(`${API_BASE}/vet/${petId}/history`, { headers: getHeaders() });
    if (!response.ok) return [];
    return await response.json();
};


// Actualizar datos de mascota
export const updatePet = async (id, petData) => {
    const response = await fetch(`${API_BASE}/vet/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(petData)
    });
    
    if (!response.ok) throw new Error("Error al actualizar mascota");
    return await response.json();
};