const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// LIST - done
function list(req, res) {
    res.json({ data: orders });
}

// Middleware to check if an order exists
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({ status: 404, message: `Order id not found: ${orderId}` });
}

// Middleware to validate the order body
function validateOrder(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

    if (!deliverTo || deliverTo === "") {
        return next({ status: 400, message: "Order must include a deliverTo" });
    }
    if (!mobileNumber || mobileNumber === "") {
        return next({ status: 400, message: "Order must include a mobileNumber" });
    }
    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
        return next({ status: 400, message: "Order must include at least one dish" });
    }

    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
            return next({ status: 400, message: `Dish ${i} must have a quantity that is an integer greater than 0` });
        }
    }

    next();
}

// Middleware to validate order status
function validateStatus(req, res, next) {
    const { data: { status } = {} } = req.body;
    if (!status || status === "" || !["pending", "preparing", "out-for-delivery", "delivered"].includes(status)) {
        return next({ status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered" });
    }
    if (res.locals.order && res.locals.order.status === "delivered") {
        return next({ status: 400, message: "A delivered order cannot be changed" });
    }
    next();
}

// Middleware to check if order ID in the body matches the route parameter
function validateOrderId(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id && id !== orderId) {
        return next({ status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.` });
    }
    next();
}

// CREATE - done
function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status: status || "pending",
        dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

// READ - done
function read(req, res) {
    res.json({ data: res.locals.order });
}

// UPDATE - fixed
function update(req, res) {
    let order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    order = { ...order, deliverTo, mobileNumber, status, dishes };

    res.json({ data: order });
}

// DELETE - done
function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    if (index > -1) {
        orders.splice(index, 1);
    }
    res.sendStatus(204);
}

// Middleware to prevent deleting non-pending orders
function checkPendingStatus(req, res, next) {
    const order = res.locals.order;
    if (order.status !== "pending") {
        return next({ status: 400, message: "An order cannot be deleted unless it is pending" });
    }
    next();
}

module.exports = {
    list,
    create: [validateOrder, create],
    read: [orderExists, read],
    update: [orderExists, validateOrder, validateStatus, validateOrderId, update],
    delete: [orderExists, checkPendingStatus, destroy],
};
