const { DataTypes } = require("sequelize");
const db = require("./db");

const Vote = db.define("vote", {
  // Rank/preference order (1 = first choice, 2 = second choice, etc.)
  // Lower rank number = higher preference
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
});

module.exports = Vote;

