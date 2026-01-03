const pool = require('../config/database');
const config = require('../config/config');

const itemQuery = `
  SELECT 
    i.item_id AS id,
    i.title,
    i.description,
    i.condition,
    i.status,
    i.price,
    i.created_at AS "timePosted",
    c.name AS category,
    u.full_name AS seller_name,
    u.avatar_url AS seller_avatar,
    u.contact_link AS location,
    u.user_id AS "ownerId",
    COALESCE(s.reputation, 0) AS seller_rating,
    (SELECT array_agg(ii.image_id) FROM ItemImage ii WHERE ii.item_id = i.item_id) AS image_ids
  FROM Item i
  LEFT JOIN Category c ON i.category_id = c.category_id
  LEFT JOIN "User" u ON i.user_id = u.user_id
  LEFT JOIN Student s ON u.user_id = s.student_id
`;

const formatItem = (row) => ({
    id: row.id.toString(),
    title: row.title,
    description: row.description,
    timePosted: row.timePosted,
    location: row.location,
    category: row.category,
    condition: row.condition,
    price: parseFloat(row.price),
    images: (row.image_ids || []).map(id => `${config.app.url}/api/images/${id}`),
    seller: {
        name: row.seller_name,
        avatar: row.seller_avatar,
        rating: parseFloat(row.seller_rating),
    },
    status: row.status,
    ownerId: row.ownerId.toString(),
});

// Get all items
exports.getAllItems = async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(`${itemQuery} ORDER BY i.created_at DESC`);
        const items = result.rows.map(formatItem);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};

// Get item by ID
exports.getItemById = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        client = await pool.connect();
        const result = await client.query(`${itemQuery} WHERE i.item_id = $1`, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        const item = formatItem(result.rows[0]);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};

// Create item
exports.createItem = async (req, res) => {
    let client;
    try {
        const { userId, category, title, description, condition, location, price } = req.body;
        const files = req.files;

        client = await pool.connect();
        await client.query('BEGIN');

        // Handle Category
        let categoryIdToUse = null;
        if (category) {
            const catResult = await client.query('SELECT category_id FROM Category WHERE name = $1', [category]);

            if (catResult.rows.length > 0) {
                categoryIdToUse = catResult.rows[0].category_id;
            } else {
                const newCatResult = await client.query(
                    'INSERT INTO Category (name, description) VALUES ($1, $2) RETURNING category_id',
                    [category, 'Auto-generated category']
                );
                categoryIdToUse = newCatResult.rows[0].category_id;
            }
        }

        // Insert item
        const itemResult = await client.query(`
            INSERT INTO Item (user_id, category_id, title, description, condition, status, price)
            VALUES ($1, $2, $3, $4, $5, 'available', $6)
            RETURNING item_id, created_at
        `, [userId, categoryIdToUse, title, description, condition, price || 0]);

        const itemId = itemResult.rows[0].item_id;

        // Insert images
        if (files && files.length > 0) {
            for (const file of files) {
                await client.query(`
                    INSERT INTO ItemImage (item_id, filename, content_type, data)
                    VALUES ($1, $2, $3, $4)
                `, [itemId, file.originalname, file.mimetype, file.buffer]);
            }
        }

        // Update user contact_link
        if (location) {
            await client.query('UPDATE "User" SET contact_link = $1 WHERE user_id = $2', [location, userId]);
        }

        await client.query('COMMIT');

        // Fetch the complete item
        const result = await client.query(`${itemQuery} WHERE i.item_id = $1`, [itemId]);
        const item = formatItem(result.rows[0]);

        res.status(201).json(item);
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};

// Update item
exports.updateItem = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        const { title, description, condition, category, price, status } = req.body;
        const files = req.files;

        client = await pool.connect();
        await client.query('BEGIN');

        // Handle Category
        let categoryIdToUse = null;
        if (category) {
            const catResult = await client.query('SELECT category_id FROM Category WHERE name = $1', [category]);
            if (catResult.rows.length > 0) {
                categoryIdToUse = catResult.rows[0].category_id;
            } else {
                const newCatResult = await client.query(
                    'INSERT INTO Category (name, description) VALUES ($1, $2) RETURNING category_id',
                    [category, 'Auto-generated category']
                );
                categoryIdToUse = newCatResult.rows[0].category_id;
            }
        }

        // Update item
        await client.query(`
            UPDATE Item
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                condition = COALESCE($3, condition),
                category_id = COALESCE($4, category_id),
                price = COALESCE($5, price),
                status = COALESCE($6, status)
            WHERE item_id = $7
        `, [title, description, condition, categoryIdToUse, price, status, id]);

        // Insert new images if provided
        if (files && files.length > 0) {
            await client.query('DELETE FROM ItemImage WHERE item_id = $1', [id]);
            for (const file of files) {
                await client.query(`
                    INSERT INTO ItemImage (item_id, filename, content_type, data)
                    VALUES ($1, $2, $3, $4)
                `, [id, file.originalname, file.mimetype, file.buffer]);
            }
        }

        await client.query('COMMIT');

        // Fetch the updated item
        const result = await client.query(`${itemQuery} WHERE i.item_id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const item = formatItem(result.rows[0]);
        res.json(item);
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};

// Delete item
exports.deleteItem = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        client = await pool.connect();
        
        const result = await client.query('DELETE FROM Item WHERE item_id = $1 RETURNING item_id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};
