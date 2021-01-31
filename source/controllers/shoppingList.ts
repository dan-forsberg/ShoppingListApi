import IShoppingList from "../interfaces/shoppingList";
import logging from "../config/logging";
import ShoppingList from "../models/shoppingList";
import { ListNotFoundError, ListItemNotFoundError } from "../interfaces/errors";
import { Request, Response } from "express";
import mongoose from "mongoose";
const workspace = "ListController";
const selection = "_id name createdAt items";

type ListListItem = {
    /* any because @types/mongoose isn't properly typed */
    shoppingList: any | null;
    listItem: any | null;
};

async function getListItem(listID: any, itemID: any): Promise<ListListItem> {
    let result: ListListItem = { shoppingList: null, listItem: null };
    /* any because @types/mongoose isn't typed properly
       or because I can't figure out how to type things properly to get
       TS to be happy. This is actually a IShoppingList (which contains IShoppingListItem) */
    let shoppingList: any = await ShoppingList.findById({ _id: listID });

    if (shoppingList !== null) {
        result.shoppingList = shoppingList;
        result.listItem = shoppingList.items.id(itemID);
    }

    return result;
}

function makeStringToItem(item: any): { item: string, bought: boolean; } {
    if (typeof item === 'string')
        return { item: item, bought: false };
    else if (!item.hasOwnProperty('bought'))
        item.bought = false;
    return item;
};

const getAllLists = async (req: Request, res: Response) => {
    try {
        const lists: Array<IShoppingList> = await ShoppingList.find().where('hidden').equals(false).select(selection);
        res.status(200).json({ 'lists': lists, count: lists.length });
    } catch (ex) {
        logging.error(workspace, "Could not get lists.", ex);
        res.status(500);
    }
};

const hideList = async (req: Request, res: Response) => {
    const listID = req.params.listID;
    try {
        if (listID === undefined) {
            throw new ListNotFoundError("List not found.");
        }

        const shoppingList = await ShoppingList.findById({ _id: listID });
        if (!shoppingList) {
            throw new ListNotFoundError("List not found.");
        } else {
            shoppingList.hidden = true;
            await shoppingList.save();
            res.status(200).json({ list: shoppingList });
        }
    } catch (ex) {
        if (ex instanceof ListNotFoundError) {
            res.status(400).json({ message: `List not found, ID: ${listID}` });
        } else {
            logging.error(workspace, "Could not hide list.", ex.message);
            res.status(500).json({ message: `Could not hide list with ID: ${listID}` });
        }
    }
};

const deleteItemFromList = async (req: Request, res: Response) => {
    const { listID, itemID } = req.params;
    const { shoppingList, listItem } = await getListItem(listID, itemID);
    try {
        if (!shoppingList) {
            throw new ListNotFoundError(`List not found, ID: ${listID}`);
        } else if (!listItem) {
            throw new ListItemNotFoundError(`List item not found, ID: ${itemID}`);
        } else {
            listItem.remove();
            await shoppingList.save();
            res.status(200).json({ list: shoppingList });
        }
    } catch (ex) {
        if (ex instanceof ListNotFoundError) {
            res.status(400).json({ message: ex.message });
        } else if (ex instanceof ListItemNotFoundError) {
            res.status(400).json({ message: ex.message });
        } else {
            logging.error(workspace, "Could not delete item from list.", ex.message);
            res.status(500);
        }
    }
};

const updateItem = async (req: Request, res: Response) => {
    const { listID, itemID } = req.params;
    const { shoppingList, listItem } = await getListItem(listID, itemID);
    const newItem = makeStringToItem(req.body.item);
    try {
        if (!shoppingList) {
            throw new ListNotFoundError(`List not found, ID: ${listID}`);
        } else if (!listItem) {
            throw new ListItemNotFoundError(`List item not found, ID: ${itemID}`);
        } else {
            /* to not overwrite bought status */
            const bought = listItem.bought;
            Object.assign(listItem, newItem);
            listItem.bought = bought;

            shoppingList.markModified('items');
            await shoppingList.save();
            res.status(202).json({ list: shoppingList });
        }
    } catch (ex) {
        if (ex instanceof ListNotFoundError) {
            res.status(400).json({ message: ex.message });
        } else if (ex instanceof ListItemNotFoundError) {
            res.status(400).json({ message: ex.message });
        } else {
            logging.error(workspace, "Could not update item.", ex.message);
            res.status(500);
        }
    }
};

const addItemsToList = async (req: Request, res: Response) => {
    const listID = req.params.listID;
    const newItems = req.body.items.map(makeStringToItem);
    const shoppingList = await ShoppingList.findById({ _id: listID });

    try {
        if (!shoppingList) {
            throw new ListNotFoundError(`Could not find list with ID: ${listID}`);
        } else {
            shoppingList.items.push(...newItems);
            await shoppingList.save();
            res.status(200).json(shoppingList);
        }
    } catch (ex) {
        if (ex instanceof ListNotFoundError) {
            res.status(400).json({ message: ex.message });
        } else {
            logging.error(workspace, "Could not add items to list.", ex.message);
            res.status(500);
        }
    }
};

const toggleItemAsBought = async (req: Request, res: Response) => {
    const { listID, itemID } = req.params;
    const { shoppingList, listItem } = await getListItem(listID, itemID);
    try {
        if (!shoppingList) {
            throw new ListNotFoundError(`Could not find list with ID: ${listID}`);
        } else if (!listItem) {
            throw new ListItemNotFoundError(`Could not find item with ID: ${itemID}`);
        } else {
            listItem.bought = !listItem.bought;
            shoppingList.save();
            res.status(200).json({ list: shoppingList });;
        }
    } catch (ex) {
        if (ex instanceof ListNotFoundError) {
            res.status(400).json({ message: ex.message });
        } else if (ex instanceof ListItemNotFoundError) {
            res.status(400).json({ message: ex.message });
        } else {
            logging.error(workspace, "Could not update item.", ex.message);
            res.status(500);
        }
    }
};

const createList = async (req: Request, res: Response) => {
    const items = req.body.items.map(makeStringToItem);
    const shoppingList: IShoppingList = { name: req.body.name, items: items, hidden: false };
    try {
        const newList = new ShoppingList(shoppingList);
        await newList.save();
        res.status(201).json({ 'list': newList });
    } catch (ex) {
        if (ex instanceof mongoose.Error.ValidationError) {
            res.status(400).json({ message: 'Malformed request.' });
        } else {
            res.status(500);
        }
    }
};

export default { createList, getAllLists, addItemsToList, updateItem, deleteItemFromList, hideList, toggleItemAsBought };