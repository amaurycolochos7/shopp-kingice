/**
 * KING ICE GOLD - Configuración de Supabase
 * 
 * IMPORTANTE: Este archivo contiene claves públicas (anon key).
 * La clave service_role NUNCA debe estar en el frontend.
 */

const SUPABASE_CONFIG = {
    url: 'https://abzicpxzeqtrgswclnal.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiemljcHh6ZXF0cmdzd2NsbmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDUyMzYsImV4cCI6MjA4NTMyMTIzNn0.sd764xkfuEfM5ehgx2zJVi45RB8hXTt7HTyDiJxfR8s'
};

// Cargar Supabase desde CDN
const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
