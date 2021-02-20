const mongoose = require("mongoose");
const { Schema } = mongoose;

const pageSchema = new Schema({
  name: { type: String, unique: true },
});

const Page = mongoose.model("Page", pageSchema);

module.exports = { pageSchema, Page };
