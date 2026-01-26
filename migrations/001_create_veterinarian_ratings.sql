-- Migration: Create veterinarian_ratings table
-- Date: 2026-01-25
-- Description: Tabla para almacenar calificaciones de veterinarios

-- Crear tabla de calificaciones
CREATE TABLE IF NOT EXISTS veterinarian_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Evitar múltiples ratings por la misma cita
    UNIQUE(appointment_id, user_id)
);

-- Crear índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_ratings_veterinarian ON veterinarian_ratings(veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON veterinarian_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_appointment ON veterinarian_ratings(appointment_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON veterinarian_ratings(created_at DESC);

-- Agregar columnas a la tabla veterinarians para almacenar el promedio de calificaciones
ALTER TABLE veterinarians 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_ratings INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_time_minutes INT DEFAULT 0;

-- Crear función para actualizar el promedio de calificaciones
CREATE OR REPLACE FUNCTION update_veterinarian_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE veterinarians
    SET 
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM veterinarian_ratings
            WHERE veterinarian_id = NEW.veterinarian_id
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM veterinarian_ratings
            WHERE veterinarian_id = NEW.veterinarian_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.veterinarian_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar rating cuando se inserta/actualiza una calificación
DROP TRIGGER IF EXISTS trigger_update_veterinarian_rating ON veterinarian_ratings;
CREATE TRIGGER trigger_update_veterinarian_rating
AFTER INSERT OR UPDATE ON veterinarian_ratings
FOR EACH ROW
EXECUTE FUNCTION update_veterinarian_rating();

-- Crear trigger para actualizar rating cuando se elimina una calificación
DROP TRIGGER IF EXISTS trigger_delete_veterinarian_rating ON veterinarian_ratings;
CREATE TRIGGER trigger_delete_veterinarian_rating
AFTER DELETE ON veterinarian_ratings
FOR EACH ROW
EXECUTE FUNCTION update_veterinarian_rating();
