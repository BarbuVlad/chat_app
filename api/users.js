const express = require('express');
const router = express.Router();
const User = require('../models/User');

//----------READ----------
router.get('/', async (req,res) => {
    try{
        const users = await User.find();
        res.status(200).json(users);
    } catch(err){
        res.json({message: err});
    }
});


//Get user by id
router.get('/:id', async (req,res) => {

    try{
        const user = await User.findById(req.params.id);
        res.status(200).json(user);
    } catch(err){
        console.log(`Error at find userById: ${err}`);
        res.status(400).json ({message: `No user found!`});
    }
})

//-----------CREATE-----------
router.post('/', async (req, res) => {
    //console.log(req.body);
    //create a new user
    const user = new User({
        name: req.body.name,
        password: req.body.password
    });

    //check data
    if(!user.name || !user.password) {
        return res.status(400).json({message:'Include name and password'});
    }

    //save to DB
    try{
    const savedUser = await user.save(); //wait for DB response
    res.status(200).json({message:`User ${user.name} created! `});

    } catch (err){
        console.log(`User NOT created. ERROR: ${err}`);

        if(err.code == 11000){
        res.status(400).json({message:`User ${user.name} already exists!`});
        } else{
            res.status(400).json({message:`User ${user.name} NOT created, error occured!`});
        }
    }
});

//-----------UPDATE-----------
//update user name by id
router.put('/:id', async (req,res) => {
    try{
        const updatedUser = await User.updateOne(
            { _id: req.params.id},
            //update name:
            { $set: {name: req.body.name}}
        );
            res.status(200).json(updatedUser);
    }catch(err){
        console.log(`Error at update user. ERROR: ${err}`);
        res.status(400).json({message:`Failed to update user`});
    }
})

//-----------DELETE-----------
router.delete('/:id', async (req, res) => {
    try{
        const userDeleted = User.remove({_id: req.params.id});
        res.json(userDeleted);
    } catch(err){
        console.log(`User not deleted. ERROR: ${err}`);

    }
})

module.exports = router;