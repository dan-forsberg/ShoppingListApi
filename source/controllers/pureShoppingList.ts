import IShoppingList from "../interfaces/shoppingList";
import logging from "../config/logging";
import ShoppingList from "../models/shoppingList";
import { ListNotFoundError, ListItemNotFoundError } from "../interfaces/errors";
import IShoppingListItem from "../interfaces/shoppingListItem";
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

const getAllLists = async (): Promise<Array<IShoppingList>> => {
    return ShoppingList.find().where('hidden').equals(false).select(selection);
};

const createList = async (
    shoppingList: IShoppingList
): Promise<IShoppingList> => {
    try {
        const newList = new ShoppingList(shoppingList);
        await newList.save();
        return shoppingList;
    } catch (ex) {
        logging.error(workspace, "Could not create or save list.", ex);
        throw ex;
    }
};

const hideList = async (listID: number): Promise<IShoppingList> => {
    try {
        const shoppingList = await ShoppingList.findById({ _id: listID });
        if (!shoppingList) {
            throw new ListNotFoundError("List not found.");
        } else {
            shoppingList.hidden = true;
            await shoppingList.save();
            return shoppingList;
        }
    } catch (ex) {
        if (ex instanceof ListNotFoundError)
            logging.error(workspace, `List not found, ID: ${listID}`);
        else logging.error(workspace, `Could not hide list with ID: ${listID}`, ex);
        throw ex;
    }
};

const deleteItemFromList = async (
    listID: any,
    itemID: any
): Promise<IShoppingList> => {
    let { shoppingList, listItem } = await getListItem(listID, itemID);
    if (!shoppingList) {
        throw new ListNotFoundError(`List not found, ID: ${listID}`);
    } else if (!listItem) {
        throw new ListItemNotFoundError(`List item not found, ID: ${itemID}`);
    } else {
        listItem.remove();
        await shoppingList.save();
        return shoppingList;
    }
};

const updateItem = async (
    listID: any,
    newItem: IShoppingListItem
): Promise<IShoppingList> => {
    let { shoppingList, listItem } = await getListItem(listID, newItem._id);
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

export default { createList, getAllLists, addItemsToList, updateItem, deleteItemFromList, hideList, toggleItemAsBought };