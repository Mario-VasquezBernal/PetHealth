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

// --- MASCOTAS ---
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

// --- CITAS & VETERINARIOS ---
export const getVets = async () => {
  const response = await fetch(`${API_BASE}/appointments/vets`, { headers: getHeaders() });
  return await response.json();
};

// NUEVA FUNCIÓN PARA CREAR VETERINARIO
export const createVet = async (vetData) => {
  const response = await fetch(`${API_BASE}/appointments/vets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(vetData)
  });
  return await response.json();
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