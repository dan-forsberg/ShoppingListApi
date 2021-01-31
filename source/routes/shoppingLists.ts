import express from 'express';
import controller from '../controllers/shoppingList';

const router = express.Router();

router.post('/create/list', controller.createList);

router.get('/get/lists', controller.getAllLists);

router.put('/update/list/:listID/addItem/', controller.addItemsToList);

router.patch('/update/list/:listID/updateItem/:itemID', controller.updateItem);
router.patch('/update/list/:listID/toggleBought/:itemID', controller.toggleItemAsBought);

router.delete('/update/list/:listID/deleteItem/:itemID', controller.deleteItemFromList);
router.delete('/delete/list/:listID', controller.hideList);
export = router;
