const mongoose = require("mongoose");
const { Schema } = mongoose;
const { pageSchema } = require("./page");

const subcategorySchema = new Schema({
  name: { type: String, unique: true },
  pages: [pageSchema],
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

module.exports = { subcategorySchema, Subcategory };
