import mongoose, { Schema } from 'mongoose';
import logging from '../config/logging';
import { Document } from 'mongoose';
import IShoppingList from '../interfaces/shoppingList';

const ShoppingListItemSchema: Schema = new Schema({
    item: { type: String, required: true, trim: true },
    bought: { type: Boolean, required: true, default: false },
    amount: { type: Number, required: false },
    price: { type: Number, required: false }
});

const ShoppingListSchema: Schema = new Schema(
    {
        name: { type: String, required: false, trim: true },
        items: { type: [ShoppingListItemSchema], required: true },
        hidden: { type: Boolean, required: true, default: false }
    },
    {
        timestamps: true
    }
);

ShoppingListSchema.post<IShoppingList>('save', function () {
    logging.info('Mongo', 'ShoppingList saved: ', this);
});

export default mongoose.model<Document<IShoppingList>>('ShoppingList', ShoppingListSchema);