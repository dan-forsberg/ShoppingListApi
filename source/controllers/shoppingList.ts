import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import ShoppingList from '../models/shoppingList';

const createList = (req: Request, res: Response, next: NextFunction) => {
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

const getAllLists = (req: Request, res: Response, next: NextFunction) => {
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

export default { createList, getAllLists };
