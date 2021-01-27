import { Document, Mongoose, MongooseBuiltIns } from 'mongoose';
export default interface IShoppingListItem {
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
}
