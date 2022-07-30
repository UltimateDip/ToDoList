require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");


mongoose.connect(process.env.URL);

// Schemas and models
const itemSchema = {
    name : String,
};
const Item = mongoose.model("Item",itemSchema);

const listSchema = {
    name:String,
    listItemArray : [itemSchema], 
};

const List = mongoose.model("List",listSchema);


// Default values for a default list
const line1 = new Item({
    name: "Welcome to to-do List",
});
const line2 = new Item({
    name: "Use the + button to add items",
});
const line3 = new Item({
    name: "Click the checkbox to delete any item",
});

const defaultItems =[line1,line2,line3];


app.get("/", function (req, res) {

    const day = _.startCase(_.toLower(date.getDate()));
    Item.find({},function(err,itemArray){
        if(err){
            console.log(err);
        }else{
            if(itemArray.length==0){
                Item.insertMany(defaultItems,function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Successfully inserted default items");
                    }
                });
                res.redirect("/");
            }else{
                res.render("lists", {
                    listTittle: day,
                    itemArray: itemArray,
                });
            }
        }
    });
});

app.post("/", function (req, res) {
    // console.log(req.body);
    const day = _.startCase(_.toLower(date.getDate()));
    const item = req.body.newItem;
    const listTittle = _.startCase(_.toLower(req.body.listTittle));

    const newItem = new Item({
        name:item,
    });
    
    if (listTittle === day) {
        console.log(req.body);
        newItem.save();
        res.redirect("/");
    } else {
        List.findOne({name:req.body.listTittle},function(err,result){
            if(err){
                console.log(err);
            }else{
                result.listItemArray.push(newItem);
                result.save();
            }
        });
        res.redirect("/"+req.body.listTittle);
    }
});

app.post("/delete",function(req,res){
    // console.log(req.body);

    const day = _.startCase(_.toLower(date.getDate()));
    
    const deleteID = req.body.deleteID;
    const listTittle = _.startCase(_.toLower(req.body.listTittle));

    if(listTittle === day){
        Item.findByIdAndRemove(deleteID,function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Successfully deleted one item.");
            }
        });
        res.redirect("/");
    }else{
        List.findOneAndUpdate({name:listTittle},
            {$pull:{listItemArray:{_id:deleteID}}},
            function(err){
            if(err){
                console.log(err);
            }else{
                res.redirect("/"+listTittle);
            }
        });
    }

})

app.get("/:listTittle", function (req, res) {
    const listTittle = _.startCase(_.toLower(req.params.listTittle));

    List.findOne({name:listTittle},function(err,result){
        if(err){
            console.log(err);
        }else{
            // existing list
            if(result){
                // so directly render
                res.render("lists", {
                    listTittle: listTittle,
                    itemArray: result.listItemArray,
                });
            }else{
                // list doesn't exist, so create a new list
                const newList = new List({
                    name:listTittle,
                    listItemArray:defaultItems,
                });
                newList.save();
                res.render("lists", {
                    listTittle: listTittle,
                    itemArray: newList.listItemArray,
                });
            }
        }
    });
});


app.get("/about", function (req, res) {
    res.render("about");
});

let port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server running at port "+ port);
});
