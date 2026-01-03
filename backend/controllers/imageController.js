const pool = require('../config/database');

// Get image by ID
exports.getImage = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        client = await pool.connect();
        const result = await client.query('SELECT content_type, data FROM ItemImage WHERE image_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send('Image not found');
        }

        const image = result.rows[0];
        res.setHeader('Content-Type', image.content_type);
        res.send(image.data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching image');
    } finally {
        if (client) client.release();
    }
};
