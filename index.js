const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');
const fs = require("fs");

const serverBaseURL = process.env.DDBP_URL;
const username = process.env.DDBP_USERNAME;
const password = process.env.DDBP_PASSWORD;

// let defaultSessionID = 'c7245a84-08cf-41ce-949b-d24e6ffb2385';
let defaultSessionID = '';
let moderatorRoles = [];


readConfig();

function readConfig(){
    fs.readFile('config.json', (err, data) => {  
        if (err){
            console.log('No file found. Using defaults.');
        }else{
            const config = JSON.parse(data);
            defaultSessionID = config.defaultSessionID;
            moderatorRoles = config.moderatorRoles;
        }
    });
}


function setConfig(config){
    const data = JSON.stringify(config);  
    fs.writeFileSync('config.json', data);
    defaultSessionID = config.defaultSessionID;
    moderatorRoles = config.moderatorRoles;

}




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
    else if(primaryCommand == "set-mod-roles"){
        set_mod_roles__Command(arguments, receivedMessage);
    }
    else if(primaryCommand == "list-mod-roles"){
        list_mod_roles__Command(arguments, receivedMessage);
    }
    else if(primaryCommand == "dp-set-default-session"){
        dp_set_default_session__Command(arguments, receivedMessage);
    }
    else if(primaryCommand == "dp-list-sessions"){
        dp_list_sessions__Command(arguments, receivedMessage);
    }
    else if(primaryCommand == "dp-users"){
        dp_users__Command(arguments,receivedMessage);
    }
    else if(primaryCommand == "dp-message-all"){
        dp_message_all__Command(arguments, receivedMessage);
    }
    else if(primaryCommand == "dp-alert-all"){
        dp_message_all__Command(arguments, receivedMessage);
    }
    else {
        receivedMessage.channel.send("I don't understand the command. Try `!help`");
    }
}

function check_auth(receivedMessage, adminOnlyFlag){
    if(!receivedMessage.member){
        receivedMessage.channel.send("You must be inside a Discord server to use this command.");
        return false;
    }

    if(receivedMessage.member.permissions.has('ADMINISTRATOR')){
        return true;
    }else{
        if(adminOnlyFlag){
            return false;
        }
        
        const memberRoles = receivedMessage.member.roles;
        for(let i = 0; i<moderatorRoles; i++){
            if(message.member.roles.find(r => r.name === moderatorRoles[i])){
                return true;
            }
        }
        receivedMessage.channel.send("You do not have permission to use this command.");
        return false;
    }
}



function help__Command(arguments, receivedMessage) {
    // if (arguments.length > 0) {
    //     receivedMessage.channel.send("It looks like you might need help with " + arguments)
    // } else {
    //     receivedMessage.channel.send("I'm not sure what you need help with. Try `!help [topic]`")
    // }


    const helpMessage = "-------------__Commands__--------------\n Note: commands marked with * are permissions locked. \n\n` *(Admin only)[!p set-mod-roles <role-1> <role-2> <role-n>] Set roles that can access locked commands. \n\n[!p list-mod-roles] List roles that can access locked commands.   \n\n*[!p dp-set-default-session <SessionID>] Set the session to use for commands. Use dp-list-sessions for sessionID. \n\n[!p dp-list-sessions] Lists available sessions and their IDs \n\n[!p dp-users] Lists users currently online. If no default session is set, it will list all users.\n\n[!p dp-message-all <MessageText>] Sends a message to the session from Discord. \n\n[!p dp-alert-all <AlertText>] Sends an alert to the session from Discord.`";
    receivedMessage.channel.send(helpMessage);

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

function set_mod_roles__Command(arguments, receivedMessage){
    if(!check_auth(receivedMessage, true)){
        return;
    }

    if (arguments.length == 0) {
        receivedMessage.channel.send("No role given. please provide a role as an argument. See `!p help` for more details.");
    }else{
        setConfig({moderatorRoles: arguments,
                    defaultSessionID: defaultSessionID});
        receivedMessage.channel.send(`Moderator roles are now: ${arguments}`);
    }
}

function list_mod_roles__Command(arguments, receivedMessage){
    if (!moderatorRoles || moderatorRoles.length == 0) {
        receivedMessage.channel.send("No moderator roles exist yet.");
    }else{
        receivedMessage.channel.send(`Moderator roles are: ${moderatorRoles}`);
    }
}

function dp_set_default_session__Command(arguments, receivedMessage){
    if(!check_auth(receivedMessage)){
        return;
    }

    if (arguments.length == 0) {
        receivedMessage.channel.send("No session ID given. Try `!p set-default-session <sessionID>`. If you do not know the sessionID, use `!p dp-list-sessions` for a list of sessionIDs.");
    }
    else{
        setConfig({moderatorRoles: arguments,
            defaultSessionID: defaultSessionID});

        receivedMessage.channel.send("SessionID of " + defaultSessionID + " was set as the default session to use for the bot.");
    }
}

function dp_users__Command(arguments, receivedMessage){
    if(!check_auth(receivedMessage)){
        return;
    }

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
        // .finally(function () {
        //     // always executed
        // });
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
        // .finally(function () {
        //     // always executed
        // });
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
    //   .finally(function () {
    //     // always executed
    //   });
}

function dp_message_all__Command(arguments, receivedMessage){
    if(!check_auth(receivedMessage)){
        return;
    }

    if(arguments.length === 0){
        receivedMessage.channel.send('No message specified in the argument.');
        return;
    }

    axios({
        method: 'put',
        url: serverBaseURL + '/sessions/' + defaultSessionID,
        withCredentials: true,
        auth: {
          username: username,
          password: password
        },
        headers: {
            'Content-Type': 'application/json',
        },
        data: {
            "message": "[From Discord][ "  + receivedMessage.author.username + "]:" + arguments[0]
        }
      }).then(function (response) {
        // handle success
        receivedMessage.channel.send('Message sent.');

      })
      .catch(function (error) {
        // handle error
        console.log(error);
        receivedMessage.channel.send('Unable to send message.');
      })
    //   .finally(function () {
    //     // always executed
    //   });
}


function dp_alert_all__Command(arguments, receivedMessage){
    if(!check_auth(receivedMessage)){
        return;
    }

    if(arguments.length === 0){
        receivedMessage.channel.send('No message specified in the argument.');
        return;
    }

    axios({
        method: 'put',
        url: serverBaseURL + '/sessions/' + defaultSessionID,
        withCredentials: true,
        auth: {
          username: username,
          password: password
        },
        headers: {
            'Content-Type': 'application/json',
        },
        data: {
            "alert": "[Alert From Discord][ "  + receivedMessage.author.username + "]:" + arguments[0]
        }
      }).then(function (response) {
        // handle success
        receivedMessage.channel.send('Message sent.');

      })
      .catch(function (error) {
        // handle error
        console.log(error);
        receivedMessage.channel.send('Unable to send alert.');
      })
    //   .finally(function () {
    //     // always executed
    //   });
}

// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = process.env.DDBP_TOKEN;

client.login(bot_secret_token)