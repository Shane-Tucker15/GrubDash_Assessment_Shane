const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
//LIST - DONE
function list(req, res) {
    res.json({ data: dishes });
}
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const exp = require("constants");

/*      
    Add handlers and middleware functions to create, read, update, and list dishes. 
    Note that dishes cannot be deleted.
*/
// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({ status: 400, message: `Must include a ${propertyName}` });
    };
}
function priceIsValid(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: `price requires a valid number`
        });
    }
    next();
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish; // Attach foundDish to res.locals for access in other middlewares
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found ${dishId}`,
    });
}

function deleteNotAllowed(req, res) {
    res.status(405).json({ error: "Deleting dishes is not allowed" });
}
//CREATE - Done
function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}
//READ
function read(req, res) {
    res.json({ data: res.locals.dish });
}
//UPDATE
function update(req, res, next) {
    const { dishId } = req.params;
    const foundDish = res.locals.dish;
    const { data: { id, name, description, price, image_url } = {} } = req.body;

    if (id && id !== dishId) {
        return next({
            status: 400,
            message: `Dish id does not match :dishId. Dish: ${id}, :dishId: ${dishId}`
        });
    }

    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    res.json({ data: foundDish });
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValid,
        create
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValid,
        update
    ],
    delete: deleteNotAllowed
};
