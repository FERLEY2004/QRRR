-- Credenciales por defecto
INSERT INTO usuarios (nombre, email, passwords, rol, estado) VALUES
('Administrador', 'admin@sena.edu.co', '$2a$10$3666f.g.6YwF2m2MFJCtn.R8ftn9RkRcV6/f1yzdj3VlGZ7EESzeK', 'ADMINISTRADOR', 'ACTIVO'),
('Guarda de Seguridad', 'guarda@sena.edu.co', '$2a$10$DMCaQbx2V5QUTMYuSZvJaOk4OGfltNh2ClwOByuofhDQwBh1641dK', 'GUARDA', 'ACTIVO')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO roles (nombre_rol, descripcion) VALUES
('APRENDIZ', 'Aprendiz del SENA'),
('INSTRUCTOR', 'Instructor del SENA'),
('ADMINISTRATIVO', 'Personal administrativo'),
('VISITANTE', 'Visitante temporal'),
('GUARDA', 'Guarda de seguridad')
ON DUPLICATE KEY UPDATE nombre_rol = nombre_rol;
