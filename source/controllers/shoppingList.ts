import { Request, Response } from 'express';
import mongoose from 'mongoose';
import logging from '../config/logging';
import ShoppingList from '../models/shoppingList';
const workspace = 'ListController';

/* Used to select just the relevant fields from the DB */
const selection = '_id name createdAt items';

// post('/create/list')
const createList = async (req: Request, res: Response) => {
    /* Do some crude validation */
    let errorMsg = '';
    if (Object.keys(req.body).length > 2) errorMsg += 'Body has too many paramaters. ';
    if (!req.body.items) errorMsg += 'Items is not defined. ';
    if (req.body.date) errorMsg += 'Date should not be set in the body. ';
    if (req.body._id || req.body.id || req.params.id) errorMsg += '_id should not be set. ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    let { name, items } = req.body;

    const list = new ShoppingList({
        _id: new mongoose.Types.ObjectId(),
        name,
        items
    });
    return list
        .save()
        .then((result) => {
            logging.info(workspace, 'Created list.');
            return res.status(201).json({
                ShoppingList: result
            });
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

// get('/get/lists')
const getAllLists = (req: Request, res: Response) => {
    ShoppingList.find()
        .select(selection)
        .exec()
        .then((lists: any) => {
            logging.info(workspace, 'Sent all lists.');
            return res.status(200).json({
                lists: lists,
                count: lists.length
            });
        })
        .catch((error: any) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

// This need to be redone with indexes of the items array instead
// delete('/update/list/deleteitem/:id')
const deleteItemFromList = async (req: Request, res: Response) => {
    let errorMsg = '';
    if (!req.params.id) errorMsg += 'No ID specified. ';
    if (!req.body.items) errorMsg += 'No items in body. ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    try {
        let document = await ShoppingList.findById({ _id: req.params.id });
        let index = document.items.indexOf(req.body.items);
        if (index == -1) return res.status(400).json({ message: 'Item not found.' });
        document.items.splice(index, 1);
        await document.save();
        res.status(200).json(document);
    } catch (ex) {
        logging.error(workspace, 'Could not add item to list', ex);
        return res.status(400).json({ message: 'Could not add item.' });
    }
};

// patch('/update/list/updateitem/:id')
const updateItem = async (req: Request, res: Response) => {
    console.info(workspace, req.body);
    let errorMsg = '';
    if (req.params.id === undefined) errorMsg += 'No ID specified. ';
    if (req.body.items === undefined || req.body.items.length < 1) errorMsg += 'No items in body. ';
    if (req.body.index === undefined) errorMsg += 'No item index specified ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    try {
        let document = await ShoppingList.findById({ _id: req.params.id });
        let index = Number.parseInt(req.body.index);
        if (isNaN(req.body.index) || index > document.items.length) {
            return res.status(400).json({ message: 'Item not found.' });
        }

        document.items[index] = req.body.items;
        document.markModified('items');
        await document.save();
        res.status(200).json(document);
    } catch (ex) {
        logging.error(workspace, 'Error updating item.', ex);
    }
};

// put('/update/list/additem/:id')
const addItemsToList = async (req: Request, res: Response) => {
    let errorMsg = '';
    if (!req.params.id) errorMsg += 'No ID specified. ';
    if (!req.body.items) errorMsg += 'No items in body. ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    try {
        let document = await ShoppingList.findById({ _id: req.params.id });
        document.items.push(...req.body.items);
        await document.save();
        res.status(200).json(document);
    } catch (ex) {
        logging.error(workspace, 'Could not add item to list', ex);
        return res.status(400).json({ message: 'Could not add item.' });
    }
};

export default { createList, getAllLists, addItemsToList, updateItem, deleteItemFromList };
