import IShoppingList from "../interfaces/shoppingList";
import logging from '../config/logging';
import ShoppingList from '../models/shoppingList';

const workspace = 'ListController';
const selection = '_id name createdAt items';


function checkProperties(input: any, properties: String[]): String | null {
    let errorMsg = "Missing property/-ies: ";
    let error = false;
    properties.forEach(prop => {
        if (!input.hasOwnProperty(prop)) {
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
    /* any because @types/mongoose isn't properly typed */
    shoppingList: any | null,
    listItem: any | null,
};

async function getListItem(listID: string, itemID: string): Promise<ListListItem> {
    let result: ListListItem = { shoppingList: null, listItem: null };
    /* any because @types/mongoose isn't typed properly
       or because I can't figure out how to type things properly to get
       TS to be happy. This is actually a IShoppingList (which contains IShoppingListItem) */
    let shoppingList: any =
        await ShoppingList.findById(
            { _id: listID }
        );

    if (shoppingList !== null) {
        result.shoppingList = shoppingList;
        result.listItem = shoppingList.items.id(itemID);
    }

    return result;
}

const createList = async () => {

};
