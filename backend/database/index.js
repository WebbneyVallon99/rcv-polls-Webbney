const db = require("./db");
const User = require("./user");
const Poll = require("./poll");
const Option = require("./option");

// Define relationships
User.hasMany(Poll, { foreignKey: "userId", as: "polls" });
Poll.belongsTo(User, { foreignKey: "userId", as: "creator" });

Poll.hasMany(Option, { foreignKey: "pollId", as: "options", onDelete: "CASCADE" });
Option.belongsTo(Poll, { foreignKey: "pollId", as: "poll" });

module.exports = {
  db,
  User,
  Poll,
  Option,
};
