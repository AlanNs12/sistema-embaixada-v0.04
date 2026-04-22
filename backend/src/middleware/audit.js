const pool = require('../config/database');

const audit = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode < 400 && req.user) {
      try {
        const entityId = req.params.id || data?.id || data?.data?.id || null;
        await pool.query(
          `INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            req.user.id,
            req.user.name,
            action,
            entity,
            entityId,
            JSON.stringify({ body: req.body, params: req.params }),
            req.ip,
          ]
        );
      } catch (e) {
        console.error('Audit log error:', e.message);
      }
    }
    return originalJson(data);
  };
  next();
};

module.exports = audit;
