import { Document } from 'mongoose';
export default interface IShoppingListItem extends Document {
    item: String;
    bought: Boolean;
    cost?: Number;
    amount?: Number;
    _id: Number;
}

export default interface IShoppingList extends Document {
    name?: String;
    items?: Array<IShoppingListItem>;
    _id: Number;
    hidden: Boolean;
}
