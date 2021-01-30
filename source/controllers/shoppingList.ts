import { Request, Response } from 'express';
import logging from '../config/logging';
import IShoppingList from '../interfaces/shoppingList';
import ShoppingList from '../models/shoppingList';

const workspace = 'ListController';

/* Used to select just the relevant fields from the DB */
const selection = '_id name createdAt items';
//TODO: Add more proper error handling, return the results more consistently
//TODO: Only return params in selection is returned
//TODO: Use errorhandler middleware

const checkProperties = (req: Request, properties: String[]): String | null => {
    let errorMsg = "Missing property/-ies: ";
    let error = false;
    properties.forEach(prop => {
        if (!req.body.hasOwnProperty(prop)) {
            errorMsg += `${prop} `;
            error = true;
        }
    });

    return (error ? errorMsg : null);
};


const makeStringToItem = (item: any): { item: string, bought: boolean; } => {
    if (typeof item === 'string')
        return { item: item, bought: false };
    else if (!item.hasOwnProperty('bought'))
        item.bought = false;
    return item;
};

// post('/create/list')
const createList = async (req: Request, res: Response) => {
    let errorMsg = checkProperties(req, ["items"]);
    if (errorMsg) {
        res.status(401).json({ 'message': errorMsg });
        return;
    }

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
        res.status(401).json({ message: error.message });
        logging.error(workspace, `Could not save list ${list}.`);
    }
};

// delete('/delete/list:id')
const hideList = async (req: Request, res: Response) => {
    let errorMsg = checkProperties(req, ["id"]);
    if (errorMsg) {
        res.status(401).json({ 'message': errorMsg });
        return;
    }

    let id = req.params.id;
    let list: IShoppingList = await ShoppingList.findById({ _id: id });

    if (list !== null) {
        list.hidden = true;
        await list.save();
        res.status(200).json({ message: 'List deleted.' });
    } else {
        res.status(400).json({ message: 'List not found.' });
    }
};

// get('/get/lists')
const getAllLists = async (req: Request, res: Response) => {
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
};

// TODO: Support multiple indexes in one request
// delete('/update/list/deleteitem/:id')
const deleteItemFromList = async (req: Request, res: Response) => {
    let errorMsg = checkProperties(req, ["item"]);
    if (errorMsg) {
        res.status(401).json({ 'message': errorMsg });
        return;
    }
   
    let document: IShoppingList | null =
        await ShoppingList.findById(
            { _id: req.params.id }
        );

    if (document === null) {
        res.status(400).json({ message: 'List not found.' });
        return;
    }

    //@ts-ignore -- I promise this is right, I've just not type:d thing right
    let subDoc = document.items.id(req.body.item);
    if (subDoc === null) {
        res.status(400).json({ message: 'Item not found.' });
    } else {
        subDoc.remove();
        await document.save();
        res.status(200).json({ message: 'Item deleted.' });
    }
};

// TODO: support multiple items in one request
// patch('/update/list/updateitem/:id')
const updateItem = async (req: Request, res: Response) => { 
    let errorMsg = checkProperties(req, ["item", "item.id"]);
    if (errorMsg) {
        res.status(401).json({ 'message': errorMsg });
        return;
    }

    let document: IShoppingList = await ShoppingList.findById({ _id: req.params.id });
    let item = makeStringToItem(req.body.item);

    //@ts-ignore -- this is correct, things are not properly typed
    let subDocument = document.items.id(item.id);
    Object.assign(subDocument, item);

    document.save();
    res.status(200).json(document);
};

// put('/update/list/additem/:id')
const addItemsToList = async (req: Request, res: Response) => {
    let errorMsg = checkProperties(req, ["items"]);
    if (errorMsg) {
        res.status(401).json({ 'message': errorMsg });
        return;
    }

    let document = await ShoppingList.findById({ _id: req.params.id });
    let newItems = req.body.items.map(makeStringToItem);

    document.items.push(...newItems);
    await document.save();

    res.status(200).json(document);
};

// patch('/update/list/togglebought/:id')
const toggleItemAsBought = async (req: Request, res: Response) => {
    let errorMsg = checkProperties(req, ["item"]);
    if (errorMsg) {
        res.status(401).json({ 'message': errorMsg });
        return;
    }

    let document: IShoppingList | null = await ShoppingList.findById(
        { _id: req.params.id }
    );

    if (document === null) {
        res.status(400).json({ message: 'List not found.' });
    } else {
        let itemID = req.body.item;
        //@ts-ignore - this is right, things are just not typed properly
        let subDoc = document.items.id(itemID);
        if (subDoc === null) {
            res.status(400).json({ message: 'Item not found.' });
        } else {
            subDoc.bought = !subDoc.bought;
            document.markModified('items');
            await document.save();
            res.status(200).json({ document });
        }
    }
};

export default { createList, getAllLists, addItemsToList, updateItem, deleteItemFromList, deleteList: hideList, toggleItemAsBought };
