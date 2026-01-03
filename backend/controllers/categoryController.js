const pool = require('../config/database');

// Get all categories
exports.getAllCategories = async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT category_id AS id, name, description FROM Category ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};
