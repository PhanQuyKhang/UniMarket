const pool = require('../config/database');

// Get exchange requests for user
exports.getUserExchangeRequests = async (req, res) => {
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
            offeredItemIds: [row.offeredItemId.toString()],
            requesterConfirmed: row.requesterConfirmed,
            ownerConfirmed: row.ownerConfirmed,
        }));

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
};

// Create exchange request
exports.createExchangeRequest = async (req, res) => {
    let client;
    try {
        const { senderId, receiverId, itemId, offeredItemIds, message } = req.body;

        // Validate input
        if (!senderId || !receiverId || !itemId || !offeredItemIds || !Array.isArray(offeredItemIds) || offeredItemIds.length === 0) {
            return res.status(400).json({ error: 'Missing required fields or invalid offered items' });
        }

        const offeredItemId = offeredItemIds[0];

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
};

// Update exchange request
exports.updateExchangeRequest = async (req, res) => {
    let client;
    try {
        const { id } = req.params;
        const { status, userId } = req.body;

        client = await pool.connect();
        await client.query('BEGIN');

        // Get current request
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

        // Validation checks
        if (status === 'accepted') {
            if (currentStatus !== 'pending') {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: `Cannot accept exchange. Current status is ${currentStatus}` });
            }
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

            if (senderConfirmed && receiverConfirmed) {
                newStatus = 'completed';
            } else {
                newStatus = 'accepted';
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
            await client.query("UPDATE Item SET status = 'exchanging' WHERE item_id = $1", [sender_item_id]);
            await client.query("UPDATE Item SET status = 'exchanging' WHERE item_id = $1", [receiver_item_id]);
        } else if (newStatus === 'completed') {
            await client.query("UPDATE Item SET status = 'exchanged' WHERE item_id = $1", [sender_item_id]);
            await client.query("UPDATE Item SET status = 'exchanged' WHERE item_id = $1", [receiver_item_id]);
        } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
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
};
