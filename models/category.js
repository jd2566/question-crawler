const mongoose = require("mongoose");
const { Schema } = mongoose;
const { subcategorySchema } = require("./subcategory");

const categorySchema = new Schema({
  name: { type: String, unique: true },
  subcategories: [subcategorySchema],
});

const Category = mongoose.model("Category", categorySchema);

module.exports = { categorySchema, Category };
