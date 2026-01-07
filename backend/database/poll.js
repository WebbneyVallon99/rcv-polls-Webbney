const { DataTypes } = require("sequelize");
const db = require("./db");

const Poll = db.define("poll", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("open", "closed"),
    defaultValue: "open",
    allowNull: false,
  },
  closeDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Poll;

