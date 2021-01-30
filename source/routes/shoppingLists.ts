import express from 'express';
import controller from '../controllers/shoppingList';

const router = express.Router();

router.post('/create/list', controller.createList);

router.get('/get/lists', controller.getAllLists);

router.put('/update/list/addItem/:id', controller.addItemsToList);

router.patch('/update/list/updateItem/:id', controller.updateItem);
router.patch('/update/list/toggleBought/:id', controller.toggleItemAsBought);

router.delete('/update/list/deleteItem/:id', controller.deleteItemFromList);
router.delete('/delete/list/:id', controller.hideList);
export = router;
