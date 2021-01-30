import { Document } from 'mongoose';
import IShoppingListItemSchema from '../models/shoppingList';

export default interface IShoppingList extends Document {
    name?: String;
    items: Array<typeof IShoppingListItemSchema>;
    _id: Number;
    hidden: Boolean;
}
