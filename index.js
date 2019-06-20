const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');

const serverBaseURL = process.env.URL;
const username = process.env.USERNAME;
const password = process.env.PASSWORD;

let defaultSessionID = '';
let moderatorRoles = '';


client.on('message', (receivedMessage) => {
    if (receivedMessage.author == client.user) { // Prevent bot from responding to its own messages
        return
    }
    
    if (receivedMessage.content.startsWith("!p")) {
        console.log(receivedMessage.channel.type);
        processCommand(receivedMessage)
    }
})

function processCommand(receivedMessage) {
    const fullCommand = (receivedMessage.content.substr(2)).trim() // Remove the leading exclamation mark
    const splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
    const primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
    const arguments = splitCommand.slice(1) // All other words are arguments/parameters/options for the command

    console.log("Command received: " + primaryCommand)
    console.log("Arguments: " + arguments) // There may not be any arguments


    if (primaryCommand == "help") {
        help__Command(arguments, receivedMessage);
    }
    else if(primaryCommand == "set-role-as-moderator"){
        set_role_as_moderator__Command(arguments, receivedMessage);
    }
    else if(primaryCommand == "set-default-session"){
        set_default_session__Command(arguments, receivedMessage);
    }
    else if(primaryCommand == "dp-list-sessions"){
        dp_list_sessions__Command(arguments, receivedMessage);
    }
    else if(primaryCommand == "dp-users"){
        dp_users__Command(arguments,receivedMessage);
    }
    else {
        receivedMessage.channel.send("I don't understand the command. Try `!help`");
    }
}

function check_auth(receivedMessage){
    if(!receivedMessage.member){
        receivedMessage.channel.send("You must be inside a Discord server to use this command.");
        return false;
    }

    if(receivedMessage.member.permissions.has('ADMINISTRATOR')){
        return true;
    }else{
        const memberRoles = receivedMessage.member.roles;
        for(let i = 0; i<moderatorRoles; i++){
            if(memberRoles.includes(moderatorRoles[i])){
                return true;
            }
        }
        receivedMessage.channel.send("You do not have permission to use this command.");
        return false;
    }
}



function help__Command(arguments, receivedMessage) {
    if (arguments.length > 0) {
        receivedMessage.channel.send("It looks like you might need help with " + arguments)
    } else {
        receivedMessage.channel.send("I'm not sure what you need help with. Try `!help [topic]`")
    }
}

// function multiply__Command(arguments, receivedMessage) {
//     if (arguments.length < 2) {
//         receivedMessage.channel.send("Not enough values to multiply. Try `!multiply 2 4 10` or `!multiply 5.2 7`")
//         return
//     }
//     let product = 1 
//     arguments.forEach((value) => {
//         product = product * parseFloat(value)
//     })
//     receivedMessage.channel.send("The product of " + arguments + " multiplied together is: " + product.toString())
// }

function set_default_session__Command(arguments, receivedMessage){
    if(!check_auth(receivedMessage)){
        return;
    }

    if (arguments.length == 0) {
        receivedMessage.channel.send("No session ID given. Try `!p set-default-session <sessionID>`. If you do not know the sessionID, use `!p dp-list-sessions` for a list of sessionIDs.");
    }
    else{
        defaultSessionID = arguments[0];
        receivedMessage.channel.send("SessionID of " + defaultSessionID + " was set as the default session to use for the bot.");
    }
}

function dp_users__Command(arguments, receivedMessage){
    if(defaultSessionID){
        axios({
            method: 'get',
            url: serverBaseURL + '/sessions/' + defaultSessionID,
            withCredentials: true,
            auth: {
            username: username,
            password: password
            }
        }).then(function (response) {
            // handle success
            // console.log(response);

            const onlineUsers = response.data.users.filter(
                function(userEntry){
                    return userEntry.online;
                }
                ).map(
                function(userEntry){
                    const mod = userEntry.mod ? 'moderator': '';
                    const op = userEntry.op ? 'operator': '';
                
                    const privileges = [mod, op].reduce(
                        function(accumulator, currentValue){
                            if(accumulator){
                                accumulator = accumulator + ', ';
                            }
                            return accumulator + currentValue;
                        });
            
                    
                    return '\n' + userEntry.name + (privileges ? ' [' + privileges + ']': '');
                }
            );
            
            const data = response.data;

            const roomCode = data.listings.map(function(listingEntry){
                return listingEntry.roomcode;
            });
            
            receivedMessage.channel.send(
                '__' + data.title + '__ \n' 
                + '[RoomCode: ' + roomCode + '] \n'
                + '[Owner: ' + data.founder + '] \n\n'
                + data.userCount + ' users currently online: ' + onlineUsers);

        })
        .catch(function (error) {
            // handle error
            console.log(error);
            receivedMessage.channel.send('Unable to fetch info.');
        })
        .finally(function () {
            // always executed
        });
    }else{
        axios({
            method: 'get',
            url: serverBaseURL + '/users/',
            withCredentials: true,
            auth: {
            username: username,
            password: password
            }
        }).then(function (response) {
            // handle success
            // console.log(response);
            if(response.data.length > 0){
                
                const onlineUsers = response.data.map(
                    function(userEntry){
                        const mod = userEntry.mod ? 'moderator': '';
                        const op = userEntry.op ? 'operator': '';
                    
                        const privileges = [mod, op].reduce(
                            function(accumulator, currentValue){
                                if(accumulator){
                                    accumulator = accumulator + ', ';
                                }
                                return accumulator + currentValue;
                            });
                
                        
                        return '\n' + userEntry.name + (privileges ? ' [' + privileges + ']': '');
                    }
                );
                
                receivedMessage.channel.send('Users currently online: ' + onlineUsers);
            }else{
                receivedMessage.channel.send('There is no one on the server currently.');
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
            receivedMessage.channel.send('Unable to fetch info.');
        })
        .finally(function () {
            // always executed
        });
    }
}



function dp_list_sessions__Command(arguments, receivedMessage){
    axios({
        method: 'get',
        url: serverBaseURL + '/sessions',
        withCredentials: true,
        auth: {
          username: username,
          password: password
        }
      }).then(function (response) {
        // handle success
        // console.log(response);
        if(response.data.length > 0){
            
            const onlineSessions = response.data.map(
                function(sessionEntry){
                    return '\n' + "Title: " + sessionEntry.title + '  ID: ' + sessionEntry.id;
                }
            );

            receivedMessage.channel.send('Currently online sessions: ' + onlineSessions);
        }else{
            receivedMessage.channel.send('There are no sessions available.');
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
        receivedMessage.channel.send('Unable to fetch info.');
      })
      .finally(function () {
        // always executed
      });
}


// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = process.env.TOKEN;

client.login(bot_secret_token)