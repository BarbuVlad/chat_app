const express = require('express');
const router = express.Router();
const User = require('../models/Conversation');

//----------READ----------
router.get('/', async (req,res) => {
});


//Get user by id
router.get('/:id', async (req,res) => {
    
})

//-----------CREATE-----------
router.post('/', async (req, res) => {

});

//-----------UPDATE-----------
//update user name by id
router.put('/:id', async (req,res) => {

})

//-----------DELETE-----------
router.delete('/:id', async (req, res) => {

})

module.exports = router;