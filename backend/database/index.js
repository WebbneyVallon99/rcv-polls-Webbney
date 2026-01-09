const db = require("./db");
const User = require("./user");
const Poll = require("./poll");
const Option = require("./option");
const Vote = require("./vote");

// Define relationships
User.hasMany(Poll, { foreignKey: "userId", as: "polls" });
Poll.belongsTo(User, { foreignKey: "userId", as: "creator" });

Poll.hasMany(Option, { foreignKey: "pollId", as: "options", onDelete: "CASCADE" });
Option.belongsTo(Poll, { foreignKey: "pollId", as: "poll" });

User.hasMany(Vote, { foreignKey: "userId", as: "votes" });
Vote.belongsTo(User, { foreignKey: "userId", as: "user" });

Poll.hasMany(Vote, { foreignKey: "pollId", as: "votes", onDelete: "CASCADE" });
Vote.belongsTo(Poll, { foreignKey: "pollId", as: "poll" });

Option.hasMany(Vote, { foreignKey: "optionId", as: "votes", onDelete: "CASCADE" });
Vote.belongsTo(Option, { foreignKey: "optionId", as: "option" });

module.exports = {
  db,
  User,
  Poll,
  Option,
  Vote,
};
