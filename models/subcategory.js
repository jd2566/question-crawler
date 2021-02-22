const mongoose = require("mongoose");
const { Schema } = mongoose;
const { pageSchema } = require("./page");

const subcategorySchema = new Schema({
  name: { type: String, unique: true, default: "new" },
  url: { type: String, unique: true, default: "none" },
  pages: [pageSchema],
});

subcategorySchema.methods.filterInsert = async function (subs) {
  const subcategory = this.model("Subcategory");
  await subcategory.distinct("name", async function (error, names) {
    let createList = [];
    subs.forEach((name) => {
      if (!names.includes(name)) {
        createList.push({ name });
      }
    });
    if (createList.length > 0) {
      await subcategory.insertMany(createList, function (errors, docs) {
        console.log(`Inserted ${createList.length} Subcategories.`);
      });
    }
  });
};

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

module.exports = { subcategorySchema, Subcategory };
