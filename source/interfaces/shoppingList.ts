import IShoppingListItem from './shoppingListItem';

export default interface IShoppingList {
    name?: String;
    items: Array<IShoppingListItem>;
    _id: Number;
    hidden: Boolean;
}
