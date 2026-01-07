const { DataTypes } = require("sequelize");
const db = require("./db");

const Option = db.define("option", {
  text: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200],
    },
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = Option;

