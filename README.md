🐾 PetHealth: Sistema de Gestión Veterinaria (PERN Stack)

🌟 Descripción del Proyecto

PetHealth es una aplicación web full-stack diseñada para la gestión integral de mascotas, historiales médicos y la agenda de citas veterinarias. Permite a los dueños de mascotas mantener un registro detallado de la salud de sus animales y facilita la comunicación y gestión de tareas para el personal clínico.

Este proyecto sigue la arquitectura PERN Stack (PostgreSQL, Express, React, Node.js).

✨ Características Principales

Autenticación Segura (JWT): Registro de usuarios y Login protegido con JSON Web Tokens y contraseñas encriptadas con bcrypt.

Gestión de Mascotas (CRUD): Creación, lectura, actualización y eliminación de perfiles de mascotas con datos biológicos completos.

Subida de Archivos a la Nube: Integración con Cloudinary para subir fotos de mascotas directamente desde el formulario.

Módulo de Citas: Agenda de citas médicas con selección de veterinario y motivo.

Alertas Proactivas: Solicitud de revisión de historial por parte del dueño.

Seguridad y Notificaciones: Envío de correos electrónicos transaccionales (registro, confirmación de cita) usando Nodemailer y alertas visuales con react-toastify.

QR Temporal: Generación de códigos QR únicos que otorgan acceso al historial médico por tiempo limitado (20 minutos).

🛠️ Tecnologías Utilizadas

Componente

Tecnología

Descripción

Frontend

React (Vite)

Interfaz de usuario dinámica y moderna.

Styling

Tailwind CSS (v4)

Framework CSS para un diseño limpio y responsivo.

Backend

Node.js (Express)

Servidor API RESTful para manejar la lógica de negocio.

Base de Datos

PostgreSQL

Base de datos relacional robusta con soporte para tipos de datos complejos (UUIDs, Fechas).

Seguridad

jsonwebtoken, bcrypt

Autenticación basada en tokens.

Archivos

Cloudinary

Servicio en la nube para el almacenamiento de imágenes.

Email

Nodemailer

Servicio de envío de correos electrónicos transaccionales.

⚙️ Configuración del Entorno de Desarrollo

Siga estos pasos para configurar y ejecutar el proyecto en su máquina local.

Prerrequisitos

Node.js (versión 18+)

PostgreSQL (Servidor y pgAdmin)

1. Configuración de la Base de Datos (PostgreSQL)

Cree la base de datos y las tablas necesarias.

Cree una nueva base de datos llamada pethealth (o el nombre que prefiera).

Ejecute los siguientes comandos SQL para crear las tablas (esto debe ejecutarse en el Query Tool de pgAdmin):

-- Habilitar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de USUARIOS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de MASCOTAS
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    species VARCHAR(30) NOT NULL, -- Perro, Gato, etc.
    breed VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(10),
    weight NUMERIC(5,2),
    photo_url TEXT,
    is_sterilized BOOLEAN DEFAULT FALSE,
    allergies TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Veterinarios
CREATE TABLE veterinarians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    phone VARCHAR(20),
    address TEXT
);

-- 4. Tabla de Citas Médicas
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    vet_id UUID REFERENCES veterinarians(id),
    date TIMESTAMP NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Historial Médico
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vet_name VARCHAR(100),
    reason TEXT,
    diagnosis TEXT,
    measured_weight NUMERIC(5,2),
    notes TEXT
);

-- 6. Tabla de Tareas (Solicitudes de Revisión)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vet_id UUID REFERENCES veterinarians(id),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


2. Configuración del Servidor (Backend)

Navegue a la carpeta server e instale las dependencias:

cd server
npm install


Cree un archivo .env en la raíz de la carpeta server y configure su conexión a la base de datos (reemplace con sus credenciales):

# .env
DB_USER=postgres
DB_PASSWORD=su_clave
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=pethealth

JWT_SECRET=su_llave_secreta_aqui


3. Configuración del Cliente (Frontend)

Navegue a la carpeta client e instale las dependencias:

cd ../client
npm install


▶️ Ejecución del Proyecto

Asegúrese de tener dos terminales abiertas.

Iniciar el Backend:

cd server
npm run dev
# El servidor estará en http://localhost:5000


Iniciar el Frontend:

cd client
npm run dev
# La aplicación estará en http://localhost:5173/


☁️ Variables de Entorno y Servicios Externos

Para que todas las funcionalidades (imágenes y correo) operen correctamente, configure las siguientes variables:

A. Cloudinary (Gestión de Imágenes)

Las variables CLOUD_NAME y UPLOAD_PRESET se encuentran actualmente en el archivo client/src/pages/Home.jsx y deben coincidir con la configuración de su cuenta de Cloudinary.

B. Servicio de Correo Electrónico (Nodemailer)

Para evitar el error de autenticación 535, debe usar una Contraseña de Aplicación (App Password).

Edite el archivo server/utils/emailService.js y reemplace las credenciales de auth con su correo y contraseña de aplicación:

// server/utils/emailService.js
// ...
const transporter = nodemailer.createTransport({
  host: "
