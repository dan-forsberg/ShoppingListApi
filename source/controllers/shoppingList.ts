import { Request, Response } from 'express';
import logging from '../config/logging';
import IShoppingList from '../interfaces/shoppingList';
import ShoppingList from '../models/shoppingList';

const workspace = 'ListController';

/* Used to select just the relevant fields from the DB */
const selection = '_id name createdAt items';
//TODO: Add more proper error handling, return the results more consistently
//TODO: Only return params in selection is returned
//TODO: Replace promises with async/await
//TODO: Use errorhandler middleware
//TODO: Better error checking, preferably in a function?


const makeStringToItem = (item: any): { item: string, bought: boolean; } => {
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
        res.status(201).json({
            list: list /* TODO: fix, return a proper list not just [] */
        });
    } catch (error) {
        res.status(500).json();
        logging.error(workspace, `Could not save list ${list}.`, error);
    }
};

// TODO: hide list instead of delete?
// delete('/delete/list:id')
const hideList = async (req: Request, res: Response) => {
    let id = req.params.id;
    try {
        // findByIdAndDelete returns the list if successfull
        // or returns null if unsuccessfull
        let list: IShoppingList = await ShoppingList.findById({ _id: id });
        if (list) {
            list.hidden = true;
            await list.save();
            res.status(200).json({ message: 'List deleted.' });
        } else {
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
        let lists: Array<IShoppingList> = await ShoppingList
            .where('hidden')
            .equals(false)
            .select(selection);

        if (lists) {
            res.status(200).json(lists);
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
    if (!req.params.id)
        errorMsg += 'No ID specified. ';
    if (req.body.item === undefined)
        errorMsg += 'No item _id specified. ';
    if (errorMsg !== '')
        return res.status(400).json({ message: errorMsg });

    try {
        let document: IShoppingList | null =
            await ShoppingList.findById(
                { _id: req.params.id }
            );

        if (document !== null) {
            //@ts-ignore -- I promise this is right, I've just not type:d thing right
            let subDoc = document.items.id(req.body.item);
            if (subDoc === null) {
                res.status(400).json({ message: 'Item not found.' });
            } else {
                subDoc.remove();
                await document.save();
                res.status(200).json({ message: 'Item deleted.' });
            }
        } else {
            res.status(400).json({ message: 'List not found.' });
        }
    } catch (error) {
        logging.error(workspace, 'Could not remove item to list', error);
        res.status(500).json({ message: 'Could not remove item.' });
    }
};

// TODO: support multiple items in one request
// patch('/update/list/updateitem/:id')
const updateItem = async (req: Request, res: Response) => {
    let errorMsg = '';
    if (req.params.id === undefined)
        errorMsg += 'No ID specified. ';
    if (req.body.item === undefined || req.body.item.length < 1)
        errorMsg += 'No items in body. ';
    else if (req.body.item.id === undefined)
        errorMsg += 'No item ID in body.';
    if (errorMsg !== '')
        return res.status(400).json({ message: errorMsg });

    try {
        let document: IShoppingList = await ShoppingList.findById({ _id: req.params.id });
        let item = makeStringToItem(req.body.item);
        //@ts-ignore -- this is correct, things are not properly typed
        let subDocument = document.items.id(item.id);
        Object.assign(subDocument, item);

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
    if (!req.params.id)
        errorMsg += 'No ID specified. ';
    if (!req.body.items)
        errorMsg += 'No items in body. ';
    if (errorMsg !== '')
        return res.status(400).json({ message: errorMsg });

    let document = await ShoppingList.findById({ _id: req.params.id });
    let newItems = req.body.items.map(makeStringToItem);

    document.items.push(...newItems);
    await document.save();

    res.status(200).json(document);
};

// patch('/update/list/togglebought/:id')
const toggleItemAsBought = async (req: Request, res: Response) => {
    let errorMsg = '';
    if (!req.params.id)
        errorMsg += 'No ID specified. ';
    if (!req.body.item)
        errorMsg += 'No item in body. ';
    if (errorMsg !== '')
        return res.status(400).json({ message: errorMsg });

    let document: IShoppingList | null = await ShoppingList.findById(
        { _id: req.params.id }
    );

    if (document === null) {
        res.status(400).json({ message: 'List not found.' });
        return;
    }

    let itemID = req.body.item;
    //@ts-ignore - this is right, things are just not typed properly
    let subDoc = document.items.id(itemID);
    if (subDoc === null) {
        res.status(400).json({ message: 'Item not found.' });
        return;
    }
    subDoc.bought = !subDoc.bought;
    document.markModified('items');
    await document.save();
    res.status(200).json({ document });
};

export default { createList, getAllLists, addItemsToList, updateItem, deleteItemFromList, deleteList: hideList, toggleItemAsBought };
