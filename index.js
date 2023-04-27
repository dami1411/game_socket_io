const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.use(express.static(path.join(__dirname, "assets")));
var user_list = []; //lista socket -> username
var nicknames= []; //lista username
var socks_id =[]; //lista id socket
var pos = 0; //numero turno -> indice della socket a cui inviare il turno
var word_index = 0; //indice random della lista di parole da indovinare
var words = ["pentola","aquilone","lavatrice","bici","pistola","dentifricio","tovaglia","noce"];
var connected_usr_count=0; //numero di utenti connessi se >2 si può far partire il gioco
var points =[]; 
var turn_array =[]; //lista per capire a quale socket tocca
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
                                          
  socket.on('login',(user_name) => {        
    user_list[socket.id] = user_name; 
    nicknames.push(user_list[socket.id]);
    socks_id = Object.keys(user_list);
    turn_array.push(0);
    points.push(0); 
    socket.join("room");           
  });
       
  socket.on("logged",function(){
    connected_usr_count++;
    io.to("room").emit("num_usr", connected_usr_count, nicknames);
  });
   
    socket.on("ready_to_game",function(socket_id){
        if(turn_array[turn_array.length-1] == 1){
          for(var i = 0; i < turn_array.length; i++) {
            turn_array[i]=0;
          }
        } 
        pos = 0; 
        for(var i=0; i < turn_array.length; i++) {
          if(turn_array[i] == 0) break;
          else
            pos++;
          //console.log("indice array "+pos);     
        }
       
        //cerco il giocatore che deve giocare
        
        if(socks_id[pos] == socket_id) {

          word_index = Math.floor(Math.random()*words.length);
          
         
          /*if(turn < nicknames.length -1) {
            turn++; 
          }
          else turn = 0;*/
          io.to(socks_id[pos]).emit("turn", words[word_index]);//turn al posto di pos
          io.to("room").emit("play_game");
          console.log("invio "+ words[word_index]+" a "+ nicknames[pos] + "turn=pos "+pos);
        }   
                
    });
    
    socket.on('chat message', (msg, player) => {
      
        //console.log("chat message");
        io.to("room").emit('chat message', msg, user_list[socket.id]);
        //console.log(msg+" "+words[index]);
        if(msg == words[word_index]) {
          //console.log("uguali");
          points[pos]+=5;
          io.to("room").emit('turn_won',player,points[pos]);
          turn_array[pos] = 1; //mettere turn se con pos non funziona
          console.log("array turni "+turn_array);
          }
        
          
        
     
    });
    socket.on("draw",function(turn_canv){
      io.to("room").emit("copy",turn_canv);
    });
    socket.on("disconnect",function(){
    if(connected_usr_count>0){
      connected_usr_count--;
      io.to("room").emit("num_usr",connected_usr_count);
      io.to("room").emit("disconnected");
    }
    

  }); 
  socket.on("updateRoom",function(socket_disconnected_id){
    var i = socks_id.indexOf(socket_disconnected_id);
    socks_id.splice(i, 1);
    nicknames.splice(i,1);
    console.log(i);   
  });      

  });
            
server.listen(3000, () => {
  console.log('listening on *:3000');
});