import { Request, Response } from 'express';
import mongoose from 'mongoose';
import logging from '../config/logging';
import IShoppingList from '../interfaces/shoppingList';
import ShoppingList from '../models/shoppingList';
const workspace = 'ListController';

/* Used to select just the relevant fields from the DB */
const selection = '_id name createdAt items';

//TODO: Add more proper error handling, return the results more consistently

const makeStringToItem = (item: any) => {
    if (typeof item === 'string')
        return { item: item, bought: false };
    else if (!item.hasOwnProperty('bought'))
        item.bought = false;
    return item;
};

// post('/create/list')
const createList = async (req: Request, res: Response) => {
    /* Do some crude validation */
    let errorMsg = '';
    if (Object.keys(req.body).length > 2)
        errorMsg += 'Body has too many paramaters. ';
    if (!req.body.items)
        errorMsg += 'Items is not defined. ';
    if (req.body.date)
        errorMsg += 'Date should not be set in the body. ';
    if (req.body._id || req.body.id || req.params.id)
        errorMsg += '_id should not be set. ';
    if (errorMsg !== '')
        return res.status(400).json({ message: errorMsg });

    let { name, items } = req.body;
    items = items.map(makeStringToItem);

    const list = new ShoppingList({
        name,
        items
    });

    try {
        await list.save();
        logging.info(workspace, 'Created list.');
        res.status(201).json({
            list: list /* should fix */
        });
    } catch (error) {
        res.status(500).json();
        logging.error(workspace, `Could not save list ${list}.`, error);
    }
};

// TODO: hide list instead of delete?
// delete('/delete/list:id')
const deleteList = async (req: Request, res: Response) => {
    let id = req.params.id;
    try {
        // findByIdAndDelete returns the list if successfull
        // or returns null if unsuccessfull
        let list = await ShoppingList.findByIdAndDelete({ _id: id });
        if (list) {
            logging.info(workspace, `List with id ${id} deleted`);
            res.status(200).json({ message: 'List deleted.' });
        } else {
            logging.info(workspace, `List with id ${id} unsucessfully deleted.`, list);
            res.status(400).json({ message: 'List not found.' });
        }
    } catch (error) {
        res.status(500);
        logging.error(workspace, 'Could not delete list.', error);
    }
};

// get('/get/lists')
const getAllLists = async (req: Request, res: Response) => {
    try {
        let lists = await ShoppingList.find().select(selection);
        if (lists) {
            logging.info(workspace, 'Sent all lists.');
            res.status(200).json({
                lists: lists,
                count: lists.length
            });
        } else {
            logging.error(workspace, 'Could not get lists.');
            res.status(400);
        }
    } catch (error) {
        res.status(500);
    }
};

// TODO: Support multiple indexes in one request
// delete('/update/list/deleteitem/:id')
const deleteItemFromList = async (req: Request, res: Response) => {
    let errorMsg = '';
    if (!req.params.id) errorMsg += 'No ID specified. ';
    if (req.body.index === undefined) errorMsg += 'No index specified. ';
    else if (req.body.index < 0) errorMsg += 'Index must be >= 0. ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    try {
        let document: IShoppingList | null = await ShoppingList.findById({ _id: req.params.id });
        if (document !== null) {
            let index = req.body.index;
            if (!document.items || index > document.items.length) {
                return res.status(400).json({ message: 'Item not found.' });
            }

            document.items.splice(index, 1);
            document.markModified('items');
            document.save();
            res.status(200).json(document);
        } else {
            res.status(400).json({ message: 'List not found.' });
        }
    } catch (error) {
        logging.error(workspace, 'Could not add item to list', error);
        return res.status(400).json({ message: 'Could not add item.' });
    }
};

// TODO: support multiple items in one request
// patch('/update/list/updateitem/:id')
const updateItem = async (req: Request, res: Response) => {
    console.info(workspace, req.body);
    let errorMsg = '';
    if (req.params.id === undefined) errorMsg += 'No ID specified. ';
    if (req.body.items === undefined || req.body.items.length < 1) errorMsg += 'No items in body. ';
    if (req.body.index === undefined) errorMsg += 'No item index specified ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    try {
        let document: IShoppingList = await ShoppingList.findById({ _id: req.params.id });
        let index = req.body.index;
        if (!document.items || isNaN(index) || index > document.items.length) {
            res.status(400).json({ message: 'Item not found.' });
            return;
        }

        document.items[index] = req.body.items;
        document.markModified('items');
        document.save();
        res.status(200).json(document);
        logging.info(workspace, 'Item updated.');
    } catch (error) {
        logging.error(workspace, 'Error updating item.', error);
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
    } catch (error) {
        logging.error(workspace, 'Could not add item to list', error);
        return res.status(400).json({ message: 'Could not add item.' });
    }
};

// patch('/update/list/togglebought/:id')
const toggleItemAsBought = async (req: Request, res: Response) => {
    let errorMsg = '';
    if (!req.params.id) errorMsg += 'No ID specified. ';
    if (!req.body.index) errorMsg += 'No index in body. ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    let index = req.body.index;
    let document = await ShoppingList.findById({ _id: req.params.id });
    document.items[index] != document.items[index];
    await document.save();
    res.status(200).json({ document });
};

export default { createList, getAllLists, addItemsToList, updateItem, deleteItemFromList, deleteList, toggleItemAsBought };
