const express = require("express");
const router = express.Router();
const testDbRouter = require("./test-db");
const pollsRouter = require("./polls");
const votesRouter = require("./votes");

router.use("/test-db", testDbRouter);
router.use("/polls", pollsRouter);
router.use("/votes", votesRouter);

module.exports = router;
