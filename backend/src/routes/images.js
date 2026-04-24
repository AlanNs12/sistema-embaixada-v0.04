const router = require('express').Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

// GET /api/images/:entityType/:entityId — retorna imagem como base64
router.get('/:entityType/:entityId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, image_data, mime_type, original_name FROM document_images WHERE entity_type=$1 AND entity_id=$2 ORDER BY created_at DESC LIMIT 1',
      [req.params.entityType, req.params.entityId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Imagem não encontrada' });
    const img = result.rows[0];
    res.json({
      id: img.id,
      src: `data:${img.mime_type};base64,${img.image_data}`,
      mime_type: img.mime_type,
      original_name: img.original_name,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/images/id/:id — por ID direto (inline viewer)
router.get('/id/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT image_data, mime_type FROM document_images WHERE id=$1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Imagem não encontrada' });
    const { image_data, mime_type } = result.rows[0];
    const buf = Buffer.from(image_data, 'base64');
    res.set('Content-Type', mime_type);
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(buf);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
