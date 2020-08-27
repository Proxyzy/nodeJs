const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require("../models/favorite");

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})

.get(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorite)=>{
        if(favorite!=null){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        }else{
            err = new Error('Favorite list not found!');
            err.status=404;
            return next(err)
        }
    }, (err)=>next(err))
    .catch((err)=>next(err));
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite)=>{
        if(favorite===null){
            Favorites.create({user: req.user._id})
            .then((favorite)=>{
                Favorites.findById(favorite._id)
                .then((favorite)=>{
                    req.body.forEach(dish =>{
                        favorite.dishes.addToSet(dish._id)
                    })
                    favorite.save()
                    .then((favorite)=>{
                        Favorites.findById(favorite._id)
                        .then((favorite)=>{
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                })
            })
                })
            })
        }else{
            req.body.forEach(dish =>{
                favorite.dishes.addToSet(dish._id)
            })
            favorite.save()
            .then((favorite)=>{
                Favorites.findById(favorite._id)
                .then((favorite)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            })
        }
    }, (err)=>next(err))
    .catch((err)=>next(err));
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Favorites.findOneAndRemove({user: req.user._id})
    .then((resp)=>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err)=>next(err))
    .catch((err)=>next(err));
})

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite)=>{
        favorite.dishes.addToSet(req.params.dishId)
        favorite.save()
        .then((favorite)=>{
            Favorites.findOne(favorite._id)
            .then((favorite)=>{
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
        })
    }, (err)=>next(err))
    .catch((err)=>next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser,(req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite)=>{
        if(favorite!=null){
            favorite.dishes.pull(req.params.dishId);
            favorite.save()
            .then((favorite)=>{
                Favorites.findById(favorite._id)
                .then((favorite)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite)
                })
            }, (err)=> next(err));
        }else{
            err = new Error('Favorite list was not found!!');
            err.status=404;
            return next(err)
        }
    }, (err)=>next(err))
    .catch((err)=>next(err));
})


module.exports = favoriteRouter;