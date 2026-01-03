const pool = require('../config/database');

// Get user profile by ID
exports.getUserById = async (req, res) => {
    let client;
    try {
        const { userId } = req.params;
        client = await pool.connect();
        const result = await client.query(`
            SELECT 
                u.user_id,
                u.email,
                u.full_name,
                s.student_id,
                u.avatar_url,
                u.join_date,
                u.contact_link,
                COALESCE(s.reputation, 0) AS rating
            FROM "User" u
            LEFT JOIN Student s ON u.user_id = s.student_id
            WHERE u.user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};

// Get user by email
exports.getUserByEmail = async (req, res) => {
    let client;
    try {
        const { email } = req.params;
        client = await pool.connect();
        const result = await client.query(`
            SELECT 
                u.user_id AS id,
                u.email,
                u.full_name AS name,
                u.avatar_url AS picture,
                u.join_date AS "createdAt",
                COALESCE(s.reputation, 0) AS rating
            FROM "User" u
            LEFT JOIN Student s ON u.user_id = s.student_id
            WHERE u.email = $1
        `, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};

// Create or update user (login)
exports.createOrUpdateUser = async (req, res) => {
    let client;
    try {
        const { email, name, picture } = req.body;
        client = await pool.connect();

        // Check if user exists
        const existingUser = await client.query('SELECT user_id FROM "User" WHERE email = $1', [email]);

        if (existingUser.rows.length > 0) {
            // Update existing user
            const userId = existingUser.rows[0].user_id;
            await client.query(`
                UPDATE "User" 
                SET full_name = COALESCE($1, full_name),
                    avatar_url = COALESCE($2, avatar_url)
                WHERE user_id = $3
            `, [name, picture, userId]);

            const result = await client.query(`
                SELECT 
                    u.user_id AS id,
                    u.email,
                    u.full_name AS name,
                    u.avatar_url AS picture,
                    u.join_date AS "createdAt"
                FROM "User" u
                WHERE u.user_id = $1
            `, [userId]);

            const user = result.rows[0];
            res.json({
                ...user,
                id: user.id.toString()
            });
        } else {
            // Create new user
            const result = await client.query(`
                INSERT INTO "User" (email, full_name, avatar_url, contact_link)
                VALUES ($1, $2, $3, '')
                RETURNING user_id AS id, email, full_name AS name, avatar_url AS picture, join_date AS "createdAt"
            `, [email, name || '', picture || '']);

            const userId = result.rows[0].id;

            // Create Student entry
            await client.query('INSERT INTO Student (student_id, reputation) VALUES ($1, 100)', [userId]);

            const newUser = result.rows[0];
            res.status(201).json({
                ...newUser,
                id: newUser.id.toString()
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};

// Get items by user ID
exports.getUserItems = async (req, res) => {
    let client;
    try {
        const { userId } = req.params;
        const config = require('../config/config');
        
        client = await pool.connect();
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
            WHERE i.user_id = $1
            ORDER BY i.created_at DESC
        `;
        
        const result = await client.query(itemQuery, [userId]);
        const items = result.rows.map(row => ({
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
        }));
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};
