/*
This functions are used to register users and create conversations
Calls are made to the REST API server (separate entity)
Exit codes:
1 -> user_b (to start conversation with) dose not exist
2 -> user_a (starter of conversation) 
*/
const fetch = require("node-fetch");

//Create all data needed for websockets server (to be replaced by Login Register ...)
async function create_data(username_a, username_b){
    //Find user_b
    const _b = await getUser(username_b); // either: object or null
    if(_b==null){ 
        return 1; // exit code 1 -> user_b not found
    }

    //Find user_a
    let _a = await getUser(username_a);
    //if user_a does not exist, create it
    if(_a == null){
        _a = await createUser(username_a);
       // console.log(_a);
    }
    
    //With user_a and user_b; find conversation OR create one


    //add user_a to user_b contacts and vice-versa
        // contact has format key value {"conversation_id": "user_id"}


}

create_data("ion", "vlad");

//get user_b data
async function getUser(username){
     return await fetch(`http://localhost:5000/api/users/${username}`)
    .then(response => response.json())
    .then(data => {return data});
}

//Create user (with username)
async function createUser(username){
   const response =  await fetch('http://localhost:5000/api/users', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        body: JSON.stringify({"'name'": `'${username}'`}) // body data type must match "Content-Type" header
      });
return response.json();
}


function conversationAdd(){}