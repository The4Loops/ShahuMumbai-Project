const express = require("express");
const router = express.Router();
const contactUsController = require("../controllers/contactUsController");

router.post("/contact-us", contactUsController.createContact);
router.get("/contact-us", contactUsController.getAllContact);
router.get("/contact-us/:id", contactUsController.getContact);
router.put("/contact-us/:id", contactUsController.updateContact);
router.delete("/contact-us/:id", contactUsController.deleteContact);

module.exports = router;
