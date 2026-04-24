const router = require('express').Router();
const pool   = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ── IMPORTANTE: rotas específicas ANTES das genéricas ────────

// GET /api/images/id/:id — busca por ID direto da tabela
// (definida PRIMEIRO para não ser capturada por /:entityType/:entityId)
router.get('/id/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, image_data, mime_type, original_name FROM document_images WHERE id=$1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Imagem não encontrada' });
    const img = result.rows[0];
    // Sempre retorna JSON com src data-URL — mesmo formato para o frontend
    res.json({
      id: img.id,
      src: `data:${img.mime_type};base64,${img.image_data}`,
      mime_type: img.mime_type,
      original_name: img.original_name,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/images/:entityType/:entityId — busca pela entidade
router.get('/:entityType/:entityId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, image_data, mime_type, original_name
       FROM document_images
       WHERE entity_type=$1 AND entity_id=$2
       ORDER BY created_at DESC LIMIT 1`,
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

module.exports = router;
