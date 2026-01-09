const express = require("express");
const router = express.Router();
const { Poll, Option, User } = require("../database");
const upload = require("../middleware/upload");
const { authenticateJWT } = require("../auth/index");
const path = require("path");
const fs = require("fs");

// Helper to delete old image if a new one is uploaded
const deleteOldImage = (imagePath) => {
  if (imagePath && fs.existsSync(path.join(__dirname, "../public", imagePath))) {
    fs.unlinkSync(path.join(__dirname, "../public", imagePath));
  }
};

// Get all polls
router.get("/", async (req, res) => {
  try {
    const polls = await Poll.findAll({
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"],
        },
        {
          model: Option,
          as: "options",
          order: [["order", "ASC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ polls });
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({ error: "Failed to fetch polls" });
  }
});

// Get single poll by ID
router.get("/:id", async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"],
        },
        {
          model: Option,
          as: "options",
          order: [["order", "ASC"]],
        },
      ],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    res.json({ poll });
  } catch (error) {
    console.error("Error fetching poll:", error);
    res.status(500).json({ error: "Failed to fetch poll" });
  }
});

// Create new poll (authenticated)
router.post("/", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const { title, description, closeDate, options } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ error: "Poll title is required" });
    }

    // Parse options if it's a string (from form data)
    let optionsArray = [];
    if (options) {
      try {
        optionsArray = typeof options === "string" ? JSON.parse(options) : options;
      } catch (e) {
        // If not JSON, assume it's a comma-separated string
        optionsArray = options.split(",").map((opt) => opt.trim());
      }
    }

    if (!optionsArray || optionsArray.length < 2) {
      return res.status(400).json({ error: "At least 2 options are required" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Create poll
    const newPoll = await Poll.create({
      title,
      description: description || null,
      closeDate: closeDate || null,
      imageUrl,
      userId,
    });

    // Create options
    const optionPromises = optionsArray.map((optionText, index) => {
      const text = typeof optionText === "string" ? optionText : optionText.text || optionText;
      return Option.create({
        text,
        pollId: newPoll.id,
        order: index,
      });
    });

    await Promise.all(optionPromises);

    // Fetch the complete poll with options
    const completePoll = await Poll.findByPk(newPoll.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"],
        },
        {
          model: Option,
          as: "options",
          order: [["order", "ASC"]],
        },
      ],
    });

    res.status(201).json({ poll: completePoll });
  } catch (error) {
    console.error("Error creating poll:", error);
    if (req.file) {
      deleteOldImage(`/uploads/${req.file.filename}`);
    }
    res.status(500).json({ error: error.message || "Failed to create poll" });
  }
});

// Update poll (authenticated, owner only)
router.put("/:id", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only update your own polls" });
    }

    const { title, description, status, closeDate } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (closeDate !== undefined) updateData.closeDate = closeDate;

    if (req.file) {
      deleteOldImage(poll.imageUrl);
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    await poll.update(updateData);

    const updatedPoll = await Poll.findByPk(poll.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"],
        },
        {
          model: Option,
          as: "options",
          order: [["order", "ASC"]],
        },
      ],
    });

    res.json({ poll: updatedPoll });
  } catch (error) {
    console.error("Error updating poll:", error);
    res.status(500).json({ error: "Failed to update poll" });
  }
});

// Delete poll (authenticated, owner only)
router.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own polls" });
    }

    deleteOldImage(poll.imageUrl);
    await poll.destroy();

    res.json({ message: "Poll deleted successfully" });
  } catch (error) {
    console.error("Error deleting poll:", error);
    res.status(500).json({ error: "Failed to delete poll" });
  }
});

// Close poll manually (authenticated, owner only)
router.post("/:id/close", authenticateJWT, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only close your own polls" });
    }

    if (poll.status === "closed") {
      return res.status(400).json({ error: "Poll is already closed" });
    }

    await poll.update({ status: "closed" });

    const updatedPoll = await Poll.findByPk(poll.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"],
        },
        {
          model: Option,
          as: "options",
          order: [["order", "ASC"]],
        },
      ],
    });

    res.json({ poll: updatedPoll });
  } catch (error) {
    console.error("Error closing poll:", error);
    res.status(500).json({ error: "Failed to close poll" });
  }
});

// Update option (authenticated, poll owner only)
router.put("/:pollId/options/:optionId", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.pollId);

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only update options for your own polls" });
    }

    const option = await Option.findByPk(req.params.optionId);

    if (!option || option.pollId !== poll.id) {
      return res.status(404).json({ error: "Option not found" });
    }

    const { text } = req.body;
    const updateData = {};

    if (text) updateData.text = text;

    if (req.file) {
      deleteOldImage(option.imageUrl);
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    await option.update(updateData);

    res.json({ option });
  } catch (error) {
    console.error("Error updating option:", error);
    res.status(500).json({ error: "Failed to update option" });
  }
});

module.exports = router;

