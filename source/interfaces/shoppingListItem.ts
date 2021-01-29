import Document from 'mongoose';
export default interface IShoppingListItem extends Document {
    item: String;
    bought: Boolean;
    cost?: Number;
    amount?: Number;
    _id: Number;
}