import IShoppingList from "../interfaces/shoppingList";
import logging from "../config/logging";
import ShoppingList from "../models/shoppingList";
import { ListNotFoundError, ListItemNotFoundError } from "../interfaces/errors";
import IShoppingListItem from "../interfaces/shoppingListItem";
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
        const lists = ShoppingList.find().where('hidden').equals(false).select(selection);
        res.send(200).json({lists: lists, count: lists.count});
    } catch (ex) {
        logging.error(workspace, "Could not get lists.", ex);
        res.send(500);
    }
};

const hideList = async (req: Request, res: Response) => {
    const listID = req.body.id;
    try {
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
            res.status(200).json({list: shoppingList});
        }
    } catch (ex) {
        if (ex instanceof ListNotFoundError) {
            res.send(400).json({ message: 'List not found.'});
        } else if (ex instanceof ListItemNotFoundError) {
            res.send(400).json({ message: 'List item not found.'});
        } else {
            logging.error(workspace, "Could not delete item from list.", ex.message);
            res.send(500);
        }
    }
};

const updateItem = async (req: Request, res: Response) => {
    //TODO this...
    const { shoppingList, listItem } = await getListItem(listID, newItem._id);
    if (!shoppingList) {
        throw new ListNotFoundError(`List not found, ID: ${listID}`);
    } else if (!listItem) {
        throw new ListItemNotFoundError(`List item not found, ID: ${newItem._id}`);
    } else {
        Object.assign(listItem, newItem);
        return shoppingList;
    }
};

const addItemsToList = async (listID: any, newItems: IShoppingListItem[]) => {
    const shoppingList = await ShoppingList.findById({ _id: listID });
    if (!shoppingList) {
        throw new ListNotFoundError(`Could not find list with ID: ${listID}`);
    }

    shoppingList.items.push(...newItems);
    await shoppingList.save();
};

const toggleItemAsBought = async (listID: any, itemID: any): Promise<IShoppingList> => {
    let { shoppingList, listItem } = await getListItem(listID, itemID);
    if (!shoppingList) {
        throw new ListNotFoundError(`Could not find list with ID: ${listID}`);
    } else if (!listItem) {
        throw new ListItemNotFoundError(`Could not find item with ID: ${itemID}`);
    } else {
        listItem.bought = !listItem.bought;
        shoppingList.save();
        return shoppingList;
    }
};

const createList = async (req: Request, res: Response) => {
    const shoppingList: IShoppingList = { ...req.body };
    try {
        const newList = new ShoppingList(shoppingList);
        await newList.save();
        let createdList = await createList(shoppingList);
        res.status(201).json({ 'list': createdList });
    } catch (ex) {
        if (ex instanceof mongoose.Error.ValidationError) {
            res.status(400).json({ message: 'Malformed request.' });
        } else {
            res.status(500);
        }
    }
}

export default { createList, getAllLists, addItemsToList, updateItem, deleteItemFromList, hideList, toggleItemAsBought };