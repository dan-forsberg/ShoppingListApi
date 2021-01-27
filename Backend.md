* Database documentation
** ShoppingList
 - Creation date
 - ID
 - Name?

** ShoppingListItem 
 - ID
 - Item
 - Bought
 - Cost?
 - Amount?

* API
Documentation of API, HTTP-method and endpoint

A shopping list sent from the server will look something like this

    {
        "id": 123456,
        "name": "ICA",
        "date": "2021-01-01",
        "items": {
            {"id": 1, "item": "milk", "bought": false},
            {"id": 2, "item": "bread", "bought": true},
            {"id": 3, "item": "eggs", "amount": 12, "bought": true}, /* buy 12 eggs */
            {"id": 4, "item": "steak", "price": 100, "bought": true} /* steak for 100 kr */
            {"id": 5, "item": "pepsi", "amount": 3, "price": 35, "bought": true}, /* 3 pepsi for 35 kr */
            ...
        }
    }

A new shopping list to the server should look something like this

    {
        "name": "Coop"
        "items": [
            "bread"
        ]
    }

An `items` item can either be a string like `"bread"` or an object `{"item": "milk", "amount": 2, "price": 20}`. Price and amount is optional. If neither is relevant then the item should be sent as a string.

Any errors should be a json-object looking like this

    {"success": false, "message": "Something went wrong."}

A successful operation should(?) return something like this

    {"sucess": true, "id": 12345}

** GET /
Should return any uncompleted shopping lists, showing ID, name and creation date.

** GET /:id
Returns the relevant `ShoppingList` or an error if the ID is not found.

** POST /shoppinglist
A json-object of a `ShoppingList`. Name is optional, date is _not_ required.

The end-point should accept a json-object with an optional `name` and a child object called `items`. The `items` can contain strings or an object. The object must then contain an `item`, `amount` and `price`

__Returns__ An ID for the shopping list if successful, otherwise an error.

** PUT /shoppinglist/:id
Used to add an item to an existing list or set an item as bought. The ID in the URL should be the ID of the list

To add "bread"

    {
        "items": {
            "bread",
        }
    }

To mark bread is bought

    {
        "items": {
            {"id": 5, "bought": true}
        }
    }

__RETURNS__ A success message or error.

** DELETE /shoppinglist:id
If no body is sent, delete the shopping list.

If a body is sent, it should be something like

    {
        "items": {
            "id": 1
        }
    }

To delete an item from a list

