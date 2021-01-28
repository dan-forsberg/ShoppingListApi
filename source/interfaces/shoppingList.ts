import { Document } from 'mongoose';
export default interface IShoppingListItem {
    item: String;
    bought: Boolean;
    cost?: Number;
    amount?: Number;
}

export default interface IShoppingList extends Document {
    name?: String;
    items?: Array<IShoppingListItem>;
    _id: Number;
}
