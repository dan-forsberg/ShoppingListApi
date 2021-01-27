import mongoose, { Schema } from 'mongoose';
import logging from '../config/logging';
import IShoppingList from '../interfaces/shoppingList';

const ShoppingListSchema: Schema = new Schema(
    {
        name: { type: String, required: false },
        items: { type: Object, required: false }
    },
    {
        timestamps: true
    }
);

ShoppingListSchema.post<IShoppingList>('save', function () {
    logging.info('Mongo', 'ShoppingList saved: ', this);
});

export default mongoose.model<IShoppingList>('ShoppingList', ShoppingListSchema);
