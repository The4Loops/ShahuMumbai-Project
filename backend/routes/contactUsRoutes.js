const express = require("express");
const router = express.Router();
const contactUsController = require("../controllers/contactUsController");

router.post("/contacts", contactUsController.createContact);
router.get("/contacts", contactUsController.getAllContact);
router.get("/contacts/:id", contactUsController.getContact);
router.put("/contacts/:id", contactUsController.updateContact);
router.delete("/contacts/:id", contactUsController.deleteContact);

module.exports = router;
