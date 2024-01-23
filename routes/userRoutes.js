const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
} = require("../controllers/userController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/", registerUser);
router.post("/login", authUser);
router.get("/", authMiddleware, allUsers);

module.exports = router;
