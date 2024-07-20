const router = require("express").Router();
// TODO: Implement the /dishes routes needed to make the tests pass
const controller = require("./dishes.controller");

router.route("/").get(controller.list).post(controller.create);
router.route("/:dishId").get(controller.read).put(controller.update).delete(controller.delete);

module.exports = router;
