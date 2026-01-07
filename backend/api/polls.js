const express = require("express");
const router = express.Router();
const { Poll, Option, User } = require("../database");
const upload = require("../middleware/upload");
const { authenticateJWT } = require("../auth/index");
const path = require("path");
const fs = require("fs");

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
        optionsArray = options.split(",").map((opt) => opt.trim()).filter(Boolean);
      }
    }

    if (!optionsArray || optionsArray.length < 2) {
      return res.status(400).json({ error: "At least 2 options are required" });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Parse closeDate if provided
    let parsedCloseDate = null;
    if (closeDate) {
      parsedCloseDate = new Date(closeDate);
      if (isNaN(parsedCloseDate.getTime())) {
        return res.status(400).json({ error: "Invalid close date format" });
      }
    }

    // Create poll
    const poll = await Poll.create({
      title,
      description: description || null,
      status: "open",
      closeDate: parsedCloseDate,
      imageUrl,
      userId,
    });

    // Create options
    const createdOptions = await Promise.all(
      optionsArray.map((optionText, index) =>
        Option.create({
          text: optionText,
          order: index,
          pollId: poll.id,
        })
      )
    );

    // Fetch poll with relationships
    const pollWithDetails = await Poll.findByPk(poll.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "username"] },
        { model: Option, as: "options", order: [["order", "ASC"]] },
      ],
    });

    res.status(201).json({ poll: pollWithDetails });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ error: "Failed to create poll" });
  }
});

// Update poll (authenticated, creator only)
router.put("/:id", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Check if user is the creator
    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "Only the poll creator can edit this poll" });
    }

    const { title, description, status, closeDate } = req.body;

    // Handle image upload - delete old image if new one is uploaded
    if (req.file) {
      if (poll.imageUrl) {
        const oldImagePath = path.join(__dirname, "..", "public", poll.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      poll.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Update fields
    if (title) poll.title = title;
    if (description !== undefined) poll.description = description;
    if (status && ["open", "closed"].includes(status)) poll.status = status;
    if (closeDate) {
      const parsedDate = new Date(closeDate);
      if (!isNaN(parsedDate.getTime())) {
        poll.closeDate = parsedDate;
      }
    }

    await poll.save();

    // Fetch updated poll with relationships
    const updatedPoll = await Poll.findByPk(poll.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "username"] },
        { model: Option, as: "options", order: [["order", "ASC"]] },
      ],
    });

    res.json({ poll: updatedPoll });
  } catch (error) {
    console.error("Error updating poll:", error);
    res.status(500).json({ error: "Failed to update poll" });
  }
});

// Close poll manually (authenticated, creator only)
router.post("/:id/close", authenticateJWT, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "Only the poll creator can close this poll" });
    }

    poll.status = "closed";
    await poll.save();

    const updatedPoll = await Poll.findByPk(poll.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "username"] },
        { model: Option, as: "options", order: [["order", "ASC"]] },
      ],
    });

    res.json({ poll: updatedPoll });
  } catch (error) {
    console.error("Error closing poll:", error);
    res.status(500).json({ error: "Failed to close poll" });
  }
});

// Add option to poll (authenticated, creator only)
router.post("/:id/options", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "Only the poll creator can add options" });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Option text is required" });
    }

    // Get current max order
    const maxOrderOption = await Option.findOne({
      where: { pollId: poll.id },
      order: [["order", "DESC"]],
    });

    const newOrder = maxOrderOption ? maxOrderOption.order + 1 : 0;

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const option = await Option.create({
      text,
      imageUrl,
      order: newOrder,
      pollId: poll.id,
    });

    res.status(201).json({ option });
  } catch (error) {
    console.error("Error adding option:", error);
    res.status(500).json({ error: "Failed to add option" });
  }
});

// Update option (authenticated, creator only)
router.put("/:id/options/:optionId", authenticateJWT, upload.single("image"), async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "Only the poll creator can edit options" });
    }

    const option = await Option.findOne({
      where: { id: req.params.optionId, pollId: poll.id },
    });

    if (!option) {
      return res.status(404).json({ error: "Option not found" });
    }

    const { text, order } = req.body;

    // Handle image upload - delete old image if new one is uploaded
    if (req.file) {
      if (option.imageUrl) {
        const oldImagePath = path.join(__dirname, "..", "public", option.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      option.imageUrl = `/uploads/${req.file.filename}`;
    }

    if (text) option.text = text;
    if (order !== undefined) option.order = parseInt(order);

    await option.save();

    res.json({ option });
  } catch (error) {
    console.error("Error updating option:", error);
    res.status(500).json({ error: "Failed to update option" });
  }
});

// Delete option (authenticated, creator only)
router.delete("/:id/options/:optionId", authenticateJWT, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "Only the poll creator can delete options" });
    }

    const option = await Option.findOne({
      where: { id: req.params.optionId, pollId: poll.id },
    });

    if (!option) {
      return res.status(404).json({ error: "Option not found" });
    }

    // Delete option image if it exists
    if (option.imageUrl) {
      const imagePath = path.join(__dirname, "..", "public", option.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await option.destroy();

    res.json({ message: "Option deleted successfully" });
  } catch (error) {
    console.error("Error deleting option:", error);
    res.status(500).json({ error: "Failed to delete option" });
  }
});

// Delete poll (authenticated, creator only)
router.delete("/:id", authenticateJWT, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id, {
      include: [{ model: Option, as: "options" }],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.userId !== req.user.id) {
      return res.status(403).json({ error: "Only the poll creator can delete this poll" });
    }

    // Delete poll image if it exists
    if (poll.imageUrl) {
      const imagePath = path.join(__dirname, "..", "public", poll.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete all option images
    for (const option of poll.options) {
      if (option.imageUrl) {
        const imagePath = path.join(__dirname, "..", "public", option.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    await poll.destroy();

    res.json({ message: "Poll deleted successfully" });
  } catch (error) {
    console.error("Error deleting poll:", error);
    res.status(500).json({ error: "Failed to delete poll" });
  }
});

module.exports = router;

