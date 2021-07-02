require('dotenv/config'); 
const {Conversation} = require('../models/Conversation');

function startWebSocketsServer(){

    let io_ = null;
    try{
    io_ = require("socket.io")(process.env.PORT_WS || 3001, {
        cors: {
            origin: "*",
        }
    });
    console.log(`\n********************\nWS SERVER STARTED PORT ${process.env.PORT_WS||3001} \n********************\n`);
    } catch(err){
        console.log("\n!!******************\nWS SERVER ERROR\n******************!!\n");
    } 

    if(io_!==null){
        io_.on("connection", socket => {///<on new connection
            console.log(`WebSocket new connection ${socket.id} handled...\n`);

            socket.on("message", (msg, conversation_id) => { ///< listen on message event on specific room(conversation)
                if (conversation_id === ''){console.log("Empty conversation...\n")}
                else{
                    socket.to(conversation_id).emit("to_client_message",msg); ///< emit (forward) message to all clients in room
                    //await _pushToConversation(conversation_id, msg);
                }
            
            });

            socket.on("join_conversation", conversation_id => { ///< join event, put client in room
                socket.join(conversation_id);
            });



            // socket.on('disconnect_', (conv_id) => {
            //     console.log("User disconnecting;",socket.rooms,"\n"); // the Set contains at least the socket ID
            //     socket.leave(conv_id);
            //   });
        });
    }
}

async function _pushToConversation(conversation_id, msg){
    try{
    let conversationUpdate = await Conversation.updateOne( /*{ n: 1, nModified: 1, ok: 1 } */
        { _id: conversation_id},
        //update invites:
        { $push: {messages: msg  } }
    );
    } catch(err){
        console.log(`  ERROR at ws push to conversation.\n DEBUG INFO: conv_id:${conversation_id} msg:${msg}\n`)
    }
}

module.exports.startWebSocketsServer = startWebSocketsServer;