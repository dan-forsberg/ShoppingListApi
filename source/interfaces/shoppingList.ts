import IShoppingListItem from './shoppingListItem';

export default interface IShoppingList {
    name?: String;
    items: Array<IShoppingListItem>;
    _id?: any;
    hidden: Boolean;
}
