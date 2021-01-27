import { Request, Response } from 'express';
import mongoose from 'mongoose';
import logging from '../config/logging';
import ShoppingList from '../models/shoppingList';

const createList = async (req: Request, res: Response) => {
    /* Do some crude validation */
    let errorMsg = '';
    if (Object.keys(req.body).length > 2) errorMsg += 'Body has too many paramaters. ';
    if (!req.body.items) errorMsg += 'Items is not defined. ';
    if (req.body.date) errorMsg += 'Date should not be set in the body. ';
    if (req.body._id || req.body.id || req.params.id) errorMsg += '_id should not be set. ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    let { name, items } = req.body;

    const list = new ShoppingList({
        _id: new mongoose.Types.ObjectId(),
        name,
        items
    });
    return list
        .save()
        .then((result) => {
            return res.status(201).json({
                ShoppingList: result
            });
        })
        .catch((error) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

const getAllLists = (req: Request, res: Response) => {
    ShoppingList.find()
        .exec()
        .then((lists: any) => {
            return res.status(200).json({
                lists: lists,
                count: lists.length
            });
        })
        .catch((error: any) => {
            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

const deleteItemFromList = async (req: Request, res: Response) => {
    let errorMsg = '';
    if (!req.params.id) errorMsg += 'No ID specified. ';
    if (!req.body.items) errorMsg += 'No items in body. ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    try {
        let document = await ShoppingList.findById({ _id: req.params.id });
        let index = document.items.indexOf(req.body.items);
        if (index == -1)
            return res.status(400).json({message: "Item not found."});

        document.items.splice(index, 1);

        await document.save();
        res.status(200).json(document);
    } catch (ex) {
        console.error("ListController", "Could not add item to list", ex);
        return res.status(400).json({message: "Could not add item."});
    }
};

const updateItem = async (req:Request, res: Response) => {
    let errorMsg = '';
    if (!req.params.id) errorMsg += 'No ID specified. ';
    if (!req.body.items || req.body.items.length < 1) errorMsg += 'No items in body. ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    try {
        let document = await ShoppingList.findById({ _id: req.params.id });
        let index = document.items.indexOf(req.body.items);
        if (index == -1)
            return res.status(400).json({ message: "Item not found." });
        // är du dum i huvudet?
        document.items[index] = req.body.items[0];
        await document.save();
        res.status(200).json({ document });
    } catch (ex) {

    }
}

const addItemsToList = async (req: Request, res: Response) => {
    let errorMsg = '';
    if (!req.params.id) errorMsg += 'No ID specified. ';
    if (!req.body.items) errorMsg += 'No items in body. ';
    if (errorMsg !== '') return res.status(400).json({ message: errorMsg });

    try {
        let document = await ShoppingList.findById({ _id: req.params.id });
        document.items.push(...req.body.items);
        await document.save();
        res.status(200).json(document);
    } catch (ex) {
        console.error("ListController", "Could not add item to list", ex);
        return res.status(400).json({message: "Could not add item."});
    }
};

export default { createList, getAllLists, addItemsToList, updateItem, deleteItemFromList };
