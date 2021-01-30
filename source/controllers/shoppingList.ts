import { Request, Response } from 'express';
import logging from '../config/logging';
import IShoppingList from '../interfaces/shoppingList';
import IShoppingListItem from '../interfaces/shoppingListItem';
import ShoppingList from '../models/shoppingList';

const workspace = 'ListController';

/* Used to select just the relevant fields from the DB */
const selection = '_id name createdAt items';
//TODO: Add more proper error handling, return the results more consistently
//TODO: Only return params in selection is returned
//TODO: Use errorhandler middleware

function checkProperties (req: Request, properties: String[]): String | null {
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

function makeStringToItem(item: any): { item: string, bought: boolean; } {
    if (typeof item === 'string')
        return { item: item, bought: false };
    else if (!item.hasOwnProperty('bought'))
        item.bought = false;
    return item;
};

type ListListItem = {
    list: IShoppingList | null,
    item: IShoppingListItem | null,
};

async function getListItem(listID: string, itemID: string): Promise<ListListItem> {
    let result: ListListItem = { list: null, item: null };    
    let shoppingList: IShoppingList | null =
        await ShoppingList.findById(
            { _id: listID }
        );

    if (shoppingList !== null) {
        result.list = shoppingList;
        //@ts-ignore -- I promise this is right, I've just not type:d thing right
        let item = shoppingList.items.id(req.body.item);
        if (item !== null) {
            result.item = item;
        }
    }

    return result;
}

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
    let shoppingList: IShoppingList = await ShoppingList.findById({ _id: id });

    if (shoppingList !== null) {
        shoppingList.hidden = true;
        await shoppingList.save();
        res.status(200).json({ message: 'List deleted.' });
    } else {
        res.status(400).json({ message: 'List not found.' });
    }
};

// get('/get/lists')
const getAllLists = async (req: Request, res: Response) => {
    let shoppingLists: Array<IShoppingList> = await ShoppingList
        .where('hidden')
        .equals(false)
        .select(selection);

    if (shoppingLists) {
        res.status(200).json(shoppingLists);
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

    let list = await getListItem(req.params.id, req.body.item);
    if (!list.list) {
        res.status(400).json({ message: 'List not found.' });
    } else if (!list.item) {
        res.status(400).json({ message: 'Item not found'});
    } else {
        //@ts-ignore
        list.item.remove();
        //@ts-ignore
        await list.save();
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

    let shoppingList: IShoppingList = await ShoppingList.findById({ _id: req.params.id });
    let item = makeStringToItem(req.body.item);

    //@ts-ignore -- this is correct, things are not properly typed
    let listItemument = shoppingList.items.id(item.id);
    Object.assign(listItemument, item);

    shoppingList.save();
    res.status(200).json(shoppingList);
};

// put('/update/list/additem/:id')
const addItemsToList = async (req: Request, res: Response) => {
    let errorMsg = checkProperties(req, ["items"]);
    if (errorMsg) {
        res.status(401).json({ 'message': errorMsg });
        return;
    }

    let shoppingList = await ShoppingList.findById({ _id: req.params.id });
    let newItems = req.body.items.map(makeStringToItem);

    shoppingList.items.push(...newItems);
    await shoppingList.save();

    res.status(200).json(shoppingList);
};

// patch('/update/list/togglebought/:id')
const toggleItemAsBought = async (req: Request, res: Response) => {
    let errorMsg = checkProperties(req, ["item"]);
    if (errorMsg) {
        res.status(401).json({ 'message': errorMsg });
        return;
    }

    let shoppingList: IShoppingList | null = await ShoppingList.findById(
        { _id: req.params.id }
    );

    if (shoppingList === null) {
        res.status(400).json({ message: 'List not found.' });
    } else {
        let itemID = req.body.item;
        //@ts-ignore - this is right, things are just not typed properly
        let listItem = shoppingList.items.id(itemID);
        if (listItem === null) {
            res.status(400).json({ message: 'Item not found.' });
        } else {
            listItem.bought = !listItem.bought;
            shoppingList.markModified('items');
            await shoppingList.save();
            res.status(200).json({ shoppingList });
        }
    }
};



export default { createList, getAllLists, addItemsToList, updateItem, deleteItemFromList, deleteList: hideList, toggleItemAsBought };
