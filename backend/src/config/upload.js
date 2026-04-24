const multer = require('multer');
const pool = require('./database');

// Usa memória em vez de disco — imagem vai para o banco
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Formato não permitido. Use JPG, PNG ou WEBP.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Salva imagem no banco e retorna o ID
async function saveImageToDB(file, entityType, entityId) {
  if (!file) return null;
  const base64 = file.buffer.toString('base64');
  const result = await pool.query(
    `INSERT INTO document_images (entity_type, entity_id, image_data, mime_type, original_name, file_size)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [entityType, entityId, base64, file.mimetype, file.originalname, file.size]
  );
  return result.rows[0].id;
}

// Atualiza entity_id após inserção do registro
async function updateImageEntity(imageId, entityType, entityId) {
  if (!imageId) return;
  await pool.query(
    'UPDATE document_images SET entity_id=$1, entity_type=$2 WHERE id=$3',
    [entityId, entityType, imageId]
  );
}

module.exports = { upload, saveImageToDB, updateImageEntity };
