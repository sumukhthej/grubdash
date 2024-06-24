const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// check if the price is of type number and grater than 0
function validatePrice(req, res, next) {
    const {data: {price}} = req.body;

    if((typeof price === "number") && price > 0) {
        next()
    } else {
        next({
            status: 400,
            message: 'Dish must have a price that is an integer greater than 0'
        })
    }
}

// check if the request body has the params
function validateReqBody(property) {
    return function validate(req, res, next) {
        const {data} = req.body;
        if(data[property]) {
            next()
        } else {
            next({
                status: 400,
                message: `Dish must include a ${property}`
            })
        }
    }
}

// Check if dishId param exists and it is found in dishes-data
function dishIdExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if(foundDish) {
        res.locals.dish = foundDish;
        next()
    } else {
        next({
            status: 404,
            message: `${dishId} is not found`
        })
    }
}

function dishIdExistsForDelete(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if(foundDish) {
        res.locals.dish = foundDish;
        next()
    } else {
        next({
            status: 405,
            message: `${dishId} is not found`
        })
    }
}

// match dish id with route dishId
function idPropertyIsValid(req, res, next) {
    const dishId = req.params.dishId;
    const {data: { id } = {}} = req.body;

    if( !id  || id === dishId) {
        next()
    } else {
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
        })
    }
}

// creates a new dish
function create(req, res, next) {
    const {data: {name, description, price, image_url} = {}} = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

// fetch dish by dishId
function read(req, res, next) {
    const foundDish = res.locals.dish;
    res.status(200).json({data: foundDish});
}

// fetch all the dishes
function list(req, res, next) {
    res.status(200).json({data: dishes});
}

// update dish by dishId
function update(req, res, next) {
    const {data: {name, description, price, image_url} = {}} = req.body;
    const foundDish = res.locals.dish;

    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    res.status(200).json({data: foundDish});
}

// delete dish by dishId
function destroy(req, res, next) {
    const dishId = req.params.dishId;
    const dishIndex = dishes.findIndex((dish) => dish.id === dishId)
    dishes.splice(dishIndex, 1);
    res.status(405).json({error: "deleted"})
}

module.exports = {
    read: [
        dishIdExists,
        read
    ],
    create: [
        validateReqBody("name"),
        validateReqBody("description"),
        validatePrice,
        validateReqBody("price"),
        validateReqBody("image_url"),
        create
    ],
    update: [
        dishIdExists,
        idPropertyIsValid,
        validateReqBody("name"),
        validateReqBody("description"),
        validatePrice,
        validateReqBody("price"),
        validateReqBody("image_url"),
        update
    ],
    delete: [
        dishIdExistsForDelete,
        destroy
    ],
    list,
}