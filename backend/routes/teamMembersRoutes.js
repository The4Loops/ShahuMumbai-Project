const express = require('express');
const router = express.Router();
const teamMembersController= require('../controllers/teamMemberController');

// Define routes for team_members table
router.get('/team-members', teamMembersController.listTeamMembers); // List all with optional filters
router.post('/team-members', teamMembersController.createTeamMember); // Create new
router.get('/team-members/:id', teamMembersController.getTeamMember); // Get one by ID
router.put('/team-members/:id', teamMembersController.updateTeamMember); // Update by ID
router.delete('/team-members/:id', teamMembersController.deleteTeamMember); // Delete by ID

module.exports = router;