const Chat = require("../models/chatSchema");
const User = require("../models/userSchema");

const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json("userId param is not sent with request");
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name email pic",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    try {
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.find({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.send(fullChat[0]);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
};

const fetchChats = async (req, res) => {
  try {
    var chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name email pic",
    });

    res.status(200).send(chats);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

const createGroupChat = async (req, res) => {
  const groupName = req.body.name;
  const users = JSON.parse(req.body.users);

  if (!users || !groupName) {
    return res.status(400).send("Please fill all  the fields");
  }

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required for group chat");
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: groupName,
      isGroupChat: true,
      users: users,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.find({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).send(fullGroupChat[0]);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

const renameGroup = async (req, res) => {
  const chatId = req.body.chatId;
  const newChatName = req.body.chatName;

  if (!chatId || !newChatName) {
    return res
      .status(400)
      .send("Please provide the necessary details chatId and chatName");
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(400).send("Invalid chat");
    }

    if (chat.isGroupChat) {
      chat.chatName = newChatName;
      await chat.save();

      const updatedChat = await Chat.findById(chatId)
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      res.send(updatedChat);
    } else {
      return res.status(400).send("chat is not a group chat");
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).send("Please provide chatId and userId");
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(400).send("Invalid Chat");
    }

    if (chat.isGroupChat) {
      chat.users.push(userId);
      await chat.save();

      const updatedChat = await Chat.findById(chatId)
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      res.send(updatedChat);
    } else {
      return res.status(400).send("chat is not a group chat");
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res.status(400).send("Please provide chatId and userId");
  }

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(400).send("Invalid Chat");
    }

    if (chat.isGroupChat && chat.users.includes(userId)) {
      chat.users.pull(userId);
      await chat.save();

      const updatedChat = await Chat.findById(chatId)
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      res.send(updatedChat);
    } else {
      return res
        .status(400)
        .send(
          "chat is not a group chat or the provided user is not the part of group"
        );
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
