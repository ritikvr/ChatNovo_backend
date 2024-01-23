const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} = require("../controllers/chatControllers");

const router = express.Router();

router.post("/", authMiddleware, accessChat);

router.get("/", authMiddleware, fetchChats);

router.post("/group", authMiddleware, createGroupChat);

router.put("/rename", authMiddleware, renameGroup);

router.put("/groupadd", authMiddleware, addToGroup);

router.put("/groupremove", authMiddleware, removeFromGroup);

module.exports = router;
