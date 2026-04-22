-- Corrige o hash da senha do usuário admin padrão
-- Senha: Admin@123
UPDATE users 
SET password_hash = '$2b$10$Fut0b7vLe0TV7EOj5a03Y.W6git.sJptGLuDWZG/2xswgwwChWMRC'
WHERE email = 'admin@embaixada.gov';

-- Confirma o resultado
SELECT id, name, email, role, active FROM users;
