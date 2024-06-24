const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// check if dishes in a order is an array and the length is more than 0
function validateDishes(req, res, next) {
    const {data: {dishes}} = req.body;
    if(Array.isArray(dishes) && dishes.length > 0) {
        next()
    } else {
        next({
            status: 400,
            message: `Order must include at least one dish`
        })
    }
}

// check if order status is one of these "pending", "preparing", "out-for-delivery", "delivered"
function validateStatus(req, res, next) {
    const {data: {status}} = req.body;
    if(
        status
        &&
        ["pending", "preparing", "out-for-delivery", "delivered"].includes(status.toLowerCase())
    ) {
        next()
    } else {
        next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        })
    }
}

// check if the dish in the order quality is a number and more than 0
function validateQuantity(req, res, next) {
    const {data: {dishes}} = req.body;
    for (let index = 0; index < dishes.length; index++) {
        const { quantity } = dishes[index];
        if (typeof quantity !== "number" || quantity <= 0 || !Number.isInteger(quantity)) {
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
    }
    next()
}

// validate request body params by proeprty name
function validateReqBody(property) {
    return function validate(req, res, next) {
        const {data} = req.body;
        if(data[property]) {
            next()
        } else {
            next({
                status: 400,
                message: `Order must include a ${property}`
            })
        }
    }
}

// check if the orderId exists in the orders-data
function orderIdExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder !== undefined) {
        res.locals.foundOrder = foundOrder;
        next()
    } else {
        next({
            status: 404,
            // message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
            message: `Order id does not match route id. Order, Route: ${orderId}.`
        })
    }
}

// does dish id is matches with orderId of the request param
function idPropertyIsValid(req, res, next) {
    const orderId = req.params.orderId;
    const {data:{id} = {}} = req.body;

    if( !id  || id === orderId) {
        next()
    } else {
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
        })
    }
}

// create a order with a at least one dish
function create(req, res, next) {
    const {
        data: {
            deliverTo, mobileNumber, status,
            dishes : [{id, name, description, quantity, image_url, price}]
        } = {}
    } = req.body;

    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes: [{
            id,
            name,
            description,
            quantity,
            image_url,
            price
        }]
    }

    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

// get order by orderId
function read(req, res, next) {
    const foundDish = res.locals.foundOrder;
    res.status(200).json({data: foundDish});
}

// get all the orders
function list(req, res, next) {
    res.status(200).json({data: orders});
}

// update order by orderId
function update(req, res, next) {
    const {
        data: {
            status,
            deliverTo
        } = {}
    } = req.body;

    const foundOrder = res.locals.foundOrder
    if(foundOrder.status === "delivered") {
        next({
            status: 400,
            message: 'A delivered order cannot be changed'
        })
    } else {
        foundOrder.status = status;
        foundOrder.deliverTo = deliverTo;
        res.status(200).json({data: foundOrder});
    }
}

// check if the order status is pending, if it is not pending return error
function checkForPendingStatus(req, res, next) {
    const foundOrder = res.locals.foundOrder;
    console.log(foundOrder.status)
    if(foundOrder.status !== "pending") {
        next({
            status: 400,
            message: 'Order status is not pending'
        })
    } else {
        next()
    }
}

// delete order by order Id
function destroy(req, res, next) {
    const orderId = req.params.orderId;
    const orderIndex = orders.findIndex((dish) => dish.id === Number(orderId))
    orders.splice(orderIndex, 1);
    res.sendStatus(204)
}

module.exports = {
    read: [
        orderIdExists,
        read
    ],
    create: [
        validateReqBody("deliverTo"),
        validateReqBody("mobileNumber"),
        // validateReqBody("dishes"),
        validateDishes,
        validateQuantity,
        create
    ],
    update: [
        orderIdExists,
        idPropertyIsValid,
        validateReqBody("status"),
        validateReqBody("deliverTo"),
        validateReqBody("mobileNumber"),
        validateDishes,
        validateQuantity,
        validateStatus,
        update
    ],
    delete : [
        orderIdExists,
        checkForPendingStatus,
        destroy
    ],
    list
}