//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _= require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.DB_CONNECT);

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your TodoList!"
});

const item2 = new Item({
  name: "Hit + to add new list"
});

const item3 = new Item({
  name: "Hit - to delete an existing list"
});

const defaultItem = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find({}).exec().then((result) => {
    if (result.length == 0) {
      Item.insertMany(defaultItem).then((result) => {
        console.log("Items Inserted");
      });
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: result });
    }
  });

});

app.get("/:customListName", function (req, res) {
  // res.render("list",{})
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).exec().then((result) => {
    if (result) {
      res.render("list", { listTitle: result.name, newListItems: result.items })
    } else {
      const list = new List({
        name: customListName,
        items: defaultItem
      });

      list.save();
      res.redirect("/" + customListName);
    }
  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).exec().then((result) => {
      result.items.push(item);
      result.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.deleteItem;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then((result) => {
      console.log("Item removed");
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}}).exec().then((result)=>{
      res.redirect("/"+listName);
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
