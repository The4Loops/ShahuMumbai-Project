const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactUsController');

router.get('/contacts', contactController.getAllContact); // List all contacts with optional filters
router.post('/contacts', contactController.createContact); // Create a new contact
router.get('/contacts/:id', contactController.getContact); // Get a single contact by ID
router.put('/contacts/:id', contactController.updateContact); // Update a contact by ID
router.delete('/contacts/:id', contactController.deleteContact); // Delete a contact by ID

module.exports = router;