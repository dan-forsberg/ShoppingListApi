import express from 'express';
import controller from '../controllers/shoppingList';

const router = express.Router();
router.post('/create/list', controller.createList);
router.get('/get/lists', controller.getAllLists);
router.put('/update/list/additem/:id', controller.addItemsToList);
router.patch('/update/list/updateitem/:id', controller.updateItem);
router.delete('/update/list/deleteitem/:id', controller.deleteItemFromList);
router.delete('/delete/list/:id', controller.deleteList);
export = router;
