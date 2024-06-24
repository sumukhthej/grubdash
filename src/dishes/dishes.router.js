const router = require("express").Router();
const dishController = require("./dishes.controller")
const methodNotAllowed = require("../errors/methodNotAllowed");

router.route("/")
    .get(dishController.list)
    .post(dishController.create)
    .all(methodNotAllowed)

router.route("/:dishId")
    .get(dishController.read)
    .put(dishController.update)
    .delete(dishController.delete)
    .all(methodNotAllowed)

module.exports = router;
