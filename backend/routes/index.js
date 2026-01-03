const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Import controllers
const itemController = require('../controllers/itemController');
const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');
const exchangeController = require('../controllers/exchangeController');
const imageController = require('../controllers/imageController');

// Root route
router.get('/', (req, res) => {
    res.send('Hello from the backend!');
});

// Image routes
router.get('/api/images/:id', imageController.getImage);

// Item routes
router.get('/api/items', itemController.getAllItems);
router.get('/api/items/:id', itemController.getItemById);
router.post('/api/items', upload.array('images'), itemController.createItem);
router.put('/api/items/:id', upload.array('images'), itemController.updateItem);
router.delete('/api/items/:id', itemController.deleteItem);

// Category routes
router.get('/api/categories', categoryController.getAllCategories);

// User routes
router.get('/api/users/:userId', userController.getUserById);
router.get('/api/users/email/:email', userController.getUserByEmail);
router.post('/api/users', userController.createOrUpdateUser);
router.get('/api/users/:userId/items', userController.getUserItems);

// Exchange request routes
router.get('/api/users/:userId/exchange-requests', exchangeController.getUserExchangeRequests);
router.post('/api/exchange-requests', exchangeController.createExchangeRequest);
router.put('/api/exchange-requests/:id', exchangeController.updateExchangeRequest);

module.exports = router;
