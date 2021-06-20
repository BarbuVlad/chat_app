const express = require('express');
const router = express.Router();

const {User, validateUserData} = require('../models/User');
const bcrypt = require('bcrypt');

const { authorization } = require("../config/authorization");
const { adminAllow } = require('../config/adminAllow');
//----------READ----------
router.get('/', [authorization, adminAllow],async (req,res) => {
    try{
        const users = await User.find();
        res.status(200).json(users);
    } catch(err){
        res.json({message: err});
    }
});


///:name 'name': req.params.name
router.get('/self', authorization, async (req,res) => {
    //req.user set by authorization middleware
    //contacts 
    try{
        //create query
        let selected = "";
        for(const i in req.query){
            if(
            i==='password' || 
            i==='isAdmin' || 
            i==='__v'||
            i==='format_lists'
            ){continue;}///<do not allow those values
            selected+=i+' ';
        }
        selected+='-_id';
        //const user = await User.findOne({'name':req.user.name}).select('-password');
        const user = await User.findById(req.user._id).select(selected);

        if(req.query.format_lists==="true"){
            const format = async (list=[]) => { 
                let formated_list=[];
                 await Promise.all(list.map( async (contact)=>{ ///< await an array of promises
                    let contact_id = Array.from( contact.keys() )[0];
                    let conv_id = contact.get(contact_id);
                    //get username for this id
                    try{
                    const x = await User.findById(contact_id).select("name -_id");
                    formated_list.push({contact_id:contact_id, username:x.name, conv_id:conv_id});
                    } catch (err){///<push id as username
                        formated_list.push({contact_id:contact_id, username:contact_id, conv_id:conv_id});
                    }
                    
                }));
                //formated_list.push();
                return formated_list;
            }
            user.contacts = await format(user.contacts);
            user.pending_contacts = await format(user.pending_contacts);
            user.invites = await format(user.invites);
        }

        res.status(200).json({data:user, code:0});
    } catch(err){
        console.log(`Error at find userById: ${err}`);
        res.status(400).json ({message: `No user found!`});
    }
});



router.get('/pre_invite/:name', [authorization],async (req,res) => {
    /* Used to add other user to contact list (send invitation u.c.) 
     * code: 0 -> user found by name, _id returned 
     * code: 1 -> user already in contacts
     * code: 2 -> user invite already sent (in pending_contacts)
     * code: 3 -> user already invited by other user(invitee)
     * code: 4 -> user not found or other error
     * 
     > On front-end: show result, confirm send invitation (call /invite endpoint) 
     */
    try{
        const invitee = await User.findOne({'name': req.params.name}).select("_id pending_contacts");
        const inviter = await User.findById(req.user._id).select("pending_contacts contacts");

        //look in user contacts
        inviter.contacts.map(contact=>{
            let contact_id = Array.from( contact.keys() )[0];
            //let conv_id = a.get(user_id);
            if(invitee._id == contact_id){
                return res.status(200).json({message:"User already in contacts", code:1});
            }
        });
        //look in pending contacts (invite sent to this user)
        inviter.pending_contacts.map(contact=>{
            let contact_id = Array.from( contact.keys() )[0];
            //let conv_id = a.get(user_id);
            if(invitee._id == contact_id){
                return res.status(200).json({message:"Invitation already sent to user", code:2});
            }
        });
        //look in that other user invitations (inviter already invited by invitee)
        invitee.pending_contacts.map(contact=>{
            let contact_id = Array.from( contact.keys() )[0];
            //let conv_id = a.get(user_id);
            if(req.user._id == contact_id){
                return res.status(200).json({message:"You have already been invited by this user", code:3});
            }
        });

        return res.status(200).json({message:"User found. You can send an invite", code:0});
    } catch(err){
        console.log(`Error at find userById: ${err}`);
        res.status(400).json ({message: `No user found!`, code:4});
    }
});

//-----------CREATE-----------
router.post('/', async (req, res) => {
    //console.log(req.body);
    //create a new user
    const user = new User({
        name: req.body.name,
        contacts:[{"key":"value"}]
       // password: req.body.password
    });

    //check data
    if(!user.name) {
        return res.status(400).json({message:'Include name'});
    }

    //save to DB
    try{
    const savedUser = await user.save(); //wait for DB response
    res.status(200).json({message:user.name});//`User ${user.name} created! `

    } catch (err){
        console.log(`User NOT created. ERROR: ${err}`);

        if(err.code == 11000){
        res.status(400).json({message:`User ${user.name} already exists!`});
        } else{
            res.status(400).json({message:`User ${user.name} NOT created, error occured!`});
        }
    }
});


router.post('/register', async (req, res) => {
    //create a new user
    const user = new User({
        name: req.body.name,
        password: req.body.password
    });

    //check data
    // const valid = validateUserData(user);
    // if(valid !== 0) {
    //     return res.status(400).json({message:'Invalid data', error:valid, pass:user.password});
    // }
    if(!req.body.name || !req.body.password){
        return res.status(400).json({message:'Invalid data (username or password missing)', code:1});
    }
    //reset password to hash:
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    //save to DB
    try{
    const savedUser = await user.save(); //wait for DB response
    res.status(200).json({message:`User ${user.name} created successfully!`, code:0});//`User ${user.name} created! `

    } catch (err){
        console.log(`User NOT created. ERROR: ${err}`);

        if(err.code == 11000){
        res.status(400).json({message:`User ${user.name} already exists!`, code:2});
        } else{
            res.status(500).json({message:`User ${user.name} NOT created, error occured!`, code:-1});
        }
    }
});

router.post('/login', async (req, res) => {
    //get user
    let user = await User.findOne({name: req.body.name});
    //console.log(`\nUSER ${user._id}\n`);
    //check data
    if(!req.body.name || !req.body.password || !user){
        return res.status(400).json({message:'Invalid data.', code:1});
    }
    const valid_password = await bcrypt.compare(req.body.password, user.password);
    if(!valid_password){
        return res.status(400).json({message:'Invalid data.', code:2});
    }
    const token = user.generateAuthToken();

    res.status(200).json({message:`User ${user.name} login successfully!`, 
    token: token, 
    username:user.name, 
    code:0});
    //res.header('x-auth-token', token).status....
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