require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const config = require('./config/config');
const pool = require('./config/database');
const routes = require('./routes');

const app = express();
const port = config.server.port;

// Configure multer for file uploads (storing in memory for database insertion)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://hiuukun.github.io'  // Your GitHub Pages domain
    ],
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from the backend!');
});

// GET image by ID
app.get('/api/images/:id', async (req, res) => {
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
});

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

// GET all items
app.get('/api/items', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(`${itemQuery} ORDER BY i.created_at DESC`);
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
});

// GET a single item by ID
app.get('/api/items/:id', async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        client = await pool.connect();
        const result = await client.query(`${itemQuery} WHERE i.item_id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        const row = result.rows[0];
        const item = {
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
        };
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// GET all categories
app.get('/api/categories', async (req, res) => {
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
});

// GET user profile by ID
app.get('/api/users/:userId', async (req, res) => {
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
});

// PUT update user profile
app.put('/api/users/:userId', async (req, res) => {
    let client;
    try {
        const { userId } = req.params;
        const { name, phone, facebook, instagram, twitter, linkedin } = req.body;

        client = await pool.connect();

        const contactData = { phone, facebook, instagram, twitter, linkedin };
        const contactLinkJson = JSON.stringify(contactData);

        await client.query(`
            UPDATE "User"
            SET full_name = COALESCE($1, full_name),
                contact_link = $2
            WHERE user_id = $3
        `, [name, contactLinkJson, userId]);

        const result = await client.query(`
            SELECT 
                u.user_id,
                u.email,
                u.full_name,
                u.avatar_url,
                u.contact_link
            FROM "User" u
            WHERE u.user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        // Parse contact_link if needed, but returning as is is fine if frontend parses it?
        // Actually best to return flattened if frontend expects it, but let's stick to returning what DB has + flattened helpers if needed.
        // For consistency with GET /api/users/:userId, let's look at how that returns.
        // It returns row directly.

        res.json(user);
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// GET items by user ID
app.get('/api/users/:userId/items', async (req, res) => {
    let client;
    try {
        const { userId } = req.params;
        client = await pool.connect();
        const result = await client.query(`${itemQuery} WHERE i.user_id = $1 ORDER BY i.created_at DESC`, [userId]);
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
});

// GET user by email
app.get('/api/users/email/:email', async (req, res) => {
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
});

// GET all users (for admin)
app.get('/api/users', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(`
            SELECT 
                u.user_id AS id,
                u.email,
                u.full_name AS name,
                u.avatar_url AS avatar,
                u.join_date AS "joinDate",
                COUNT(DISTINCT i.item_id) AS "itemsListed"
            FROM "User" u
            LEFT JOIN Item i ON u.user_id = i.user_id
            GROUP BY u.user_id, u.email, u.full_name, u.avatar_url, u.join_date
            ORDER BY u.join_date DESC
        `);

        const users = result.rows.map(user => ({
            ...user,
            id: user.id.toString(),
            itemsListed: parseInt(user.itemsListed) || 0,
            status: 'active',
            rating: 5,
            itemsSold: 0,
            reports: 0
        }));

        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// POST create or update user
app.post('/api/users', async (req, res) => {
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
});

// DELETE user (admin only)
app.delete('/api/users/:id', async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        client = await pool.connect();

        await client.query('BEGIN');

        // Get all items owned by this user
        const userItems = await client.query('SELECT item_id FROM Item WHERE user_id = $1', [id]);
        const itemIds = userItems.rows.map(row => row.item_id);

        if (itemIds.length > 0) {
            // Cancel all exchange requests involving any of the user's items
            await client.query(`
                UPDATE ExchangeRequest 
                SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                WHERE (sender_item_id = ANY($1) OR receiver_item_id = ANY($1))
                AND status NOT IN ('completed', 'rejected', 'cancelled')
            `, [itemIds]);

            // Get all affected exchanges to revert other items' statuses
            const affectedExchanges = await client.query(`
                SELECT sender_item_id, receiver_item_id 
                FROM ExchangeRequest 
                WHERE (sender_item_id = ANY($1) OR receiver_item_id = ANY($1))
            `, [itemIds]);

            // Revert status of items in affected exchanges
            for (const exchange of affectedExchanges.rows) {
                const otherItemId = itemIds.includes(exchange.sender_item_id)
                    ? exchange.receiver_item_id
                    : exchange.sender_item_id;

                // Only revert if the other item doesn't belong to the user being deleted
                if (!itemIds.includes(otherItemId)) {
                    await client.query(`
                        UPDATE Item SET status = 'available' 
                        WHERE item_id = $1 AND status IN ('pending_offer', 'exchanging')
                    `, [otherItemId]);
                }
            }

            // Delete all items owned by user (cascade will handle images)
            await client.query('DELETE FROM Item WHERE user_id = $1', [id]);
        }

        // Delete from Student table if exists
        await client.query('DELETE FROM Student WHERE student_id = $1', [id]);

        // Delete user
        const result = await client.query('DELETE FROM "User" WHERE user_id = $1 RETURNING user_id', [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found' });
        }

        await client.query('COMMIT');
        res.json({
            message: 'User and all associated items deleted successfully',
            deletedItemsCount: itemIds.length
        });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error deleting user:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});


// POST create item
app.post('/api/items', upload.array('images'), async (req, res) => {
    let client;
    try {
        const { userId, category, title, description, condition, location, price } = req.body;
        const files = req.files;

        client = await pool.connect();

        // Start transaction
        await client.query('BEGIN');

        // Handle Category: Look up or Create
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

        // Update user contact_link if location provided
        if (location) {
            await client.query('UPDATE "User" SET contact_link = $1 WHERE user_id = $2', [location, userId]);
        }

        await client.query('COMMIT');

        // Fetch the complete item
        const result = await client.query(`${itemQuery} WHERE i.item_id = $1`, [itemId]);
        const row = result.rows[0];
        const item = {
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
        };

        res.status(201).json(item);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// PUT update item
app.put('/api/items/:id', upload.array('images'), async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        const { title, description, condition, status, category, price } = req.body;
        const files = req.files;

        client = await pool.connect();

        await client.query('BEGIN');

        // Handle Category: Look up or Create
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
          status = COALESCE($4, status),
          category_id = COALESCE($5, category_id),
          price = COALESCE($6, price),
          updated_at = CURRENT_TIMESTAMP
      WHERE item_id = $7
    `, [title, description, condition, status, categoryIdToUse, price, id]);

        // Update images if provided
        if (files && files.length > 0) {
            // Delete existing images
            await client.query('DELETE FROM ItemImage WHERE item_id = $1', [id]);
            // Insert new images
            for (const file of files) {
                await client.query(`
          INSERT INTO ItemImage (item_id, filename, content_type, data)
          VALUES ($1, $2, $3, $4)
        `, [id, file.originalname, file.mimetype, file.buffer]);
            }
        }

        await client.query('COMMIT');

        // Fetch updated item
        const result = await client.query(`${itemQuery} WHERE i.item_id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        const row = result.rows[0];
        const item = {
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
        };
        res.json(item);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        client = await pool.connect();

        await client.query('BEGIN');

        // Cancel all exchange requests involving this item
        await client.query(`
            UPDATE ExchangeRequest 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE (sender_item_id = $1 OR receiver_item_id = $1) 
            AND status NOT IN ('completed', 'rejected', 'cancelled')
        `, [id]);

        // Revert status of other items in affected exchanges back to 'available'
        const affectedExchanges = await client.query(`
            SELECT sender_item_id, receiver_item_id 
            FROM ExchangeRequest 
            WHERE (sender_item_id = $1 OR receiver_item_id = $1)
        `, [id]);

        for (const exchange of affectedExchanges.rows) {
            const otherItemId = exchange.sender_item_id == id ? exchange.receiver_item_id : exchange.sender_item_id;
            await client.query(`
                UPDATE Item SET status = 'available' 
                WHERE item_id = $1 AND status IN ('pending_offer', 'exchanging')
            `, [otherItemId]);
        }

        // Delete item (cascade will handle images and related data)
        const result = await client.query('DELETE FROM Item WHERE item_id = $1 RETURNING item_id', [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Item not found' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error deleting item:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});



// GET exchange requests for user
app.get('/api/users/:userId/exchange-requests', async (req, res) => {
    let client;
    try {
        const { userId } = req.params;
        client = await pool.connect();

        const result = await client.query(`
      SELECT 
        er.request_id AS id,
        er.sender_id AS "requesterId",
        er.receiver_id AS "targetOwnerId",
        er.sender_item_id AS "offeredItemId",
        er.receiver_item_id AS "targetItemId",
        er.status,
        er.message,
        er.created_at AS "createdAt",
        er.updated_at AS "updatedAt",
        er.sender_confirmed AS "requesterConfirmed",
        er.receiver_confirmed AS "ownerConfirmed",
        u_sender.full_name AS "requesterName"
      FROM ExchangeRequest er
      LEFT JOIN "User" u_sender ON er.sender_id = u_sender.user_id
      WHERE er.sender_id = $1 OR er.receiver_id = $1
      ORDER BY er.created_at DESC
    `, [userId]);

        const requests = result.rows.map(row => ({
            id: row.id.toString(),
            requesterId: row.requesterId.toString(),
            targetOwnerId: row.targetOwnerId.toString(),
            targetItemId: row.targetItemId.toString(),
            requesterName: row.requesterName,
            status: row.status,
            message: row.message,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            offeredItemIds: [row.offeredItemId.toString()], // Converted to array for frontend compatibility
            requesterConfirmed: row.requesterConfirmed,
            ownerConfirmed: row.ownerConfirmed,
        }));

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// POST create exchange request
app.post('/api/exchange-requests', async (req, res) => {
    let client;
    try {
        const { senderId, receiverId, itemId, offeredItemIds, message } = req.body;

        // Validate input
        if (!senderId || !receiverId || !itemId || !offeredItemIds || !Array.isArray(offeredItemIds) || offeredItemIds.length === 0) {
            return res.status(400).json({ error: 'Missing required fields or invalid offered items' });
        }

        const offeredItemId = offeredItemIds[0]; // Currently handling single item exchange

        client = await pool.connect();
        await client.query('BEGIN');

        // Check if sender exists in Student table
        const senderStudentCheck = await client.query('SELECT * FROM Student WHERE student_id = $1', [senderId]);
        if (senderStudentCheck.rows.length === 0) {
            console.log('Sender not found in Student table, creating...');
            await client.query('INSERT INTO Student (student_id, reputation) VALUES ($1, 100)', [senderId]);
        }

        // Check if receiver exists in Student table
        const receiverStudentCheck = await client.query('SELECT * FROM Student WHERE student_id = $1', [receiverId]);
        if (receiverStudentCheck.rows.length === 0) {
            console.log('Receiver not found in Student table, creating...');
            await client.query('INSERT INTO Student (student_id, reputation) VALUES ($1, 100)', [receiverId]);
        }

        // Create Exchange Request
        const result = await client.query(`
            INSERT INTO ExchangeRequest (sender_id, receiver_id, sender_item_id, receiver_item_id, status, message)
            VALUES ($1, $2, $3, $4, 'pending', $5)
            RETURNING request_id, created_at, updated_at
        `, [senderId, receiverId, offeredItemId, itemId, message || '']);

        const requestId = result.rows[0].request_id;

        // Update sender's item status to 'pending_offer'
        await client.query(`
            UPDATE Item SET status = 'pending_offer' WHERE item_id = $1
        `, [offeredItemId]);

        await client.query('COMMIT');

        // Get requester name
        const userResult = await client.query('SELECT full_name FROM "User" WHERE user_id = $1', [senderId]);
        const requesterName = userResult.rows[0]?.full_name || '';

        res.status(201).json({
            id: requestId.toString(),
            requesterId: senderId.toString(),
            targetOwnerId: receiverId.toString(),
            targetItemId: itemId.toString(),
            requesterName,
            status: 'pending',
            message: message || '',
            createdAt: result.rows[0].created_at,
            updatedAt: result.rows[0].updated_at,
            offeredItemIds: [offeredItemId],
            requesterConfirmed: false,
            ownerConfirmed: false,
        });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error creating exchange request:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// PUT update exchange request
app.put('/api/exchange-requests/:id', async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        const { status, userId } = req.body; // userId is needed for confirmation

        client = await pool.connect();
        await client.query('BEGIN');

        // Get current request to know items and current state
        const currentReq = await client.query('SELECT * FROM ExchangeRequest WHERE request_id = $1', [id]);
        if (currentReq.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }
        const requestData = currentReq.rows[0];
        const { sender_item_id, receiver_item_id, sender_id, receiver_id } = requestData;

        let newStatus = status;
        let senderConfirmed = requestData.sender_confirmed;
        let receiverConfirmed = requestData.receiver_confirmed;
        const currentStatus = requestData.status;

        // Validation checks based on state transitions
        if (status === 'accepted') {
            if (currentStatus !== 'pending') {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: `Cannot accept exchange. Current status is ${currentStatus}` });
            }
            // Check if items are still available/pending_offer
            const itemsCheck = await client.query(
                `SELECT item_id, status FROM Item WHERE item_id IN ($1, $2)`,
                [sender_item_id, receiver_item_id]
            );

            const invalidItems = itemsCheck.rows.filter(item =>
                item.status !== 'available' && item.status !== 'pending_offer'
            );

            if (invalidItems.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'One or more items are no longer available for exchange' });
            }
        } else if (status === 'rejected') {
            if (currentStatus !== 'pending') {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: `Cannot reject exchange. Current status is ${currentStatus}` });
            }
        } else if (status === 'cancelled') {
            if (currentStatus === 'completed' || currentStatus === 'cancelled' || currentStatus === 'rejected') {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: `Cannot cancel exchange. Current status is ${currentStatus}` });
            }
        } else if (status === 'confirmed') {
            if (currentStatus !== 'accepted') {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: `Cannot confirm exchange. Current status is ${currentStatus}` });
            }
            // Handle confirmation logic
            if (!userId) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'UserId is required for confirmation' });
            }

            if (String(userId) === String(sender_id)) {
                senderConfirmed = true;
                await client.query('UPDATE ExchangeRequest SET sender_confirmed = TRUE WHERE request_id = $1', [id]);
            } else if (String(userId) === String(receiver_id)) {
                receiverConfirmed = true;
                await client.query('UPDATE ExchangeRequest SET receiver_confirmed = TRUE WHERE request_id = $1', [id]);
            } else {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'User is not part of this exchange' });
            }

            // Check if both confirmed
            if (senderConfirmed && receiverConfirmed) {
                newStatus = 'completed';
            } else {
                newStatus = 'accepted'; // Stay accepted if only one confirmed
            }
        }

        // Update request status
        const result = await client.query(`
            UPDATE ExchangeRequest 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE request_id = $2
            RETURNING *
        `, [newStatus, id]);

        if (newStatus === 'accepted') {
            // Mark items as exchanging (in progress)
            await client.query("UPDATE Item SET status = 'exchanging' WHERE item_id = $1", [sender_item_id]);
            await client.query("UPDATE Item SET status = 'exchanging' WHERE item_id = $1", [receiver_item_id]);
        } else if (newStatus === 'completed') {
            // Mark both items as exchanged
            await client.query("UPDATE Item SET status = 'exchanged' WHERE item_id = $1", [sender_item_id]);
            await client.query("UPDATE Item SET status = 'exchanged' WHERE item_id = $1", [receiver_item_id]);
        } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
            // Revert items to available
            await client.query("UPDATE Item SET status = 'available' WHERE item_id = $1", [sender_item_id]);
            await client.query("UPDATE Item SET status = 'available' WHERE item_id = $1", [receiver_item_id]);
        }

        await client.query('COMMIT');

        const row = result.rows[0];
        const userResult = await client.query('SELECT full_name FROM "User" WHERE user_id = $1', [row.sender_id]);
        const requesterName = userResult.rows[0]?.full_name || '';

        res.json({
            id: row.request_id.toString(),
            requesterId: row.sender_id.toString(),
            targetOwnerId: row.receiver_id.toString(),
            targetItemId: row.receiver_item_id.toString(),
            requesterName,
            status: row.status,
            message: row.message,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            offeredItemIds: [row.sender_item_id.toString()],
            requesterConfirmed: row.sender_confirmed,
            ownerConfirmed: row.receiver_confirmed,
        });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error updating exchange request:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
