const mongoose = require("mongoose");
const { Schema } = mongoose;
const { subcategorySchema } = require("./subcategory");

const categorySchema = new Schema({
  name: { type: String, unique: true },
  subcategories: [subcategorySchema],
});

categorySchema.methods.filterInsert = async function (categories) {
  const category = this.model("Category");
  await category.distinct("name", async function (error, names) {
    let createList = [];
    names.forEach((name) => {
      if (!categories.includes(name)) {
        createList.push({ name });
      }
    });
    if (createList.length > 0) {
      await category.insertMany(createList, function (errors, docs) {
        console.log(`Inserted ${createList.length} Categories.`);
      });
    }
  });
};

const Category = mongoose.model("Category", categorySchema);

module.exports = { categorySchema, Category };
