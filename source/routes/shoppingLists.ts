import express from 'express';
import controller from '../controllers/shoppingList';

const router = express.Router();
router.post('/create/list', controller.createList);
router.get('/get/lists', controller.getAllLists);

export = router;
