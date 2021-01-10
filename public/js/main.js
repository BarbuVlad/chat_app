const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('chat-messages');

const socket = io();

socket.on('message', message => {
  console.log(message);
  outputMessage(message);

  //Scroll down 
  //chatMessages.scrollTop = chatMessages.scrollHeight;
 // console.log(chatMessages.scrollHeight);
});

//submit message
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const msg = e.target.elements.msg.value; //input message text

  //Emit to server
  socket.emit('chatMessage', msg);

  //clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();

});

//Output to DOM 
function outputMessage(message){
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `<p class="meta"> ${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${message.text}
  </p>
  `;
  document.querySelector(".chat-messages").appendChild(div);


}