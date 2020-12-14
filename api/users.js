const express = require('express');
const router = express.Router();

let a = {user: "val"};
//----------READ----------
router.get('/', (req,res) => {
    
    //send data
    res.json(a);
})
//Get user by id
router.get('/:id', (req,res) => {
    //send data
   if(req.params.id != null){
        res.send(req.params.id);
   } else{
       res.status(400).json ({message: `No user found!`});
   }
})

//-----------CREATE-----------
router.post('/', (req, res) => {
    //res.send(req.body);//echo back

    //create the data from req:
    const newUser = {
        name: req.body.name,
        email: req.body.email,
        confirmation: "false"
    } 
    //check data
    if(!newUser.name || !newUser.email) {
       return res.status(400).json({message:'Include name and email'});
    }
    //add in DB 

});

//-----------UPDATE-----------
//update user by id
router.put('/:id', (req,res) => {
    
   if(req.params.id != null){
        res.send(req.params.id);
   } else{
       res.status(400).json ({message: `No user found!`});
   }
})

//-----------DELETE-----------
router.delete('/:id', (req, res) => {
    if(req.params.id != null){
        res.send(req.params.id);
    }

})

module.exports = router;