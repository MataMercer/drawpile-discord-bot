const Discord = require("discord.js");
const client = new Discord.Client();
const axios = require("axios");
const fs = require("fs");

const serverBaseURL = process.env.DDBP_URL;
const username = process.env.DDBP_USERNAME;
const password = process.env.DDBP_PASSWORD;
// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = process.env.DDBP_TOKEN;

let defaultSessionID = "";
let moderatorRoles = [];

readConfig();

function readConfig() {
  fs.readFile("config.json", (err, data) => {
    if (err) {
      console.log("No file found. Using defaults.");
    } else {
      const config = JSON.parse(data);
      defaultSessionID = config.defaultSessionID;
      moderatorRoles = config.moderatorRoles;
    }
  });
}

function setConfig(config) {
  defaultSessionID = config.defaultSessionID;
  moderatorRoles = config.moderatorRoles;
  const data = JSON.stringify(config);
  fs.writeFileSync("config.json", data);
}

client.on("message", receivedMessage => {
  if (receivedMessage.author == client.user) {
    return;
  }

  if (receivedMessage.content.startsWith("!pedro")) {
    console.log(receivedMessage.channel.type);
    processCommand(receivedMessage);
  }
});

function processCommand(receivedMessage) {
  let fullCommand = receivedMessage.content.substr(2).trim(); // Remove the leading exclamation mark
  // const splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space

  fullCommand = fullCommand + " ";
  let splitCommand = [];
  wordSoFar = "";
  openQuoteFlag = false;
  for (let i = 0; i < fullCommand.length; i++) {
    if (fullCommand.charAt(i) === '"') {
      openQuoteFlag = !openQuoteFlag;
    } else if (fullCommand.charAt(i) === " " && !openQuoteFlag) {
      splitCommand.push(wordSoFar);
      wordSoFar = "";
    } else {
      wordSoFar = wordSoFar + fullCommand.charAt(i);
    }
  }
  console.log(splitCommand);

  const primaryCommand = splitCommand[0]; // The first word directly after the exclamation is the command
  const arguments = splitCommand.slice(1); // All other words are arguments/parameters/options for the command

  console.log("Command received: " + primaryCommand);
  console.log("Arguments: " + arguments); // There may not be any arguments

  if (primaryCommand == "help") {
    help__Command(arguments, receivedMessage);
  } else if (primaryCommand == "set-mod-roles") {
    set_mod_roles__Command(arguments, receivedMessage);
  } else if (primaryCommand == "list-mod-roles") {
    list_mod_roles__Command(arguments, receivedMessage);
  } else if (primaryCommand == "dp-set-default-session") {
    dp_set_default_session__Command(arguments, receivedMessage);
  } else if (primaryCommand == "dp-list-sessions") {
    dp_list_sessions__Command(arguments, receivedMessage);
  } else if (primaryCommand == "dp-users") {
    dp_users__Command(arguments, receivedMessage);
  } else if (primaryCommand == "dp-message-all") {
    dp_message_all__Command(arguments, receivedMessage);
  } else if (primaryCommand == "dp-alert-all") {
    dp_message_all__Command(arguments, receivedMessage);
  } else {
    receivedMessage.channel.send("I don't understand the command. Try `!help`");
  }
}

function check_auth(receivedMessage, adminOnlyFlag) {
  if (!receivedMessage.member) {
    receivedMessage.channel.send(
      "You must be inside a Discord server to use this command."
    );
    return false;
  }

  if (receivedMessage.member.permissions.has("ADMINISTRATOR")) {
    return true;
  } else {
    if (adminOnlyFlag) {
      return false;
    }

    for (let i = 0; i < moderatorRoles; i++) {
      if (message.member.roles.find(r => r.name === moderatorRoles[i])) {
        return true;
      }
    }
    receivedMessage.channel.send(
      "You do not have permission to use this command."
    );
    return false;
  }
}

function help__Command(arguments, receivedMessage) {
  const helpMessage =
    "-------------__Commands__--------------\n Note: commands marked with * are permissions locked. \n\n` *(Admin only)[!p set-mod-roles <role-1> <role-2> <role-n>] Set roles that can access locked commands. \n\n[!p list-mod-roles] List roles that can access locked commands.   \n\n*[!p dp-set-default-session <SessionID>] Set the session to use for commands. Use dp-list-sessions for sessionID. \n\n[!p dp-list-sessions] Lists available sessions and their IDs \n\n[!p dp-users] Lists users currently online. If no default session is set, it will list all users.\n\n*[!p dp-message-all <MessageText>] Sends a message to the session from Discord. \n\n*[!p dp-alert-all <AlertText>] Sends an alert to the session from Discord.`";
  receivedMessage.channel.send(helpMessage);
}

function set_mod_roles__Command(arguments, receivedMessage) {
  if (!check_auth(receivedMessage, true)) {
    return;
  }

  if (arguments.length == 0) {
    receivedMessage.channel.send(
      "No role given. please provide a role as an argument. See `!p help` for more details."
    );
  } else {
    setConfig({
      moderatorRoles: arguments,
      defaultSessionID: defaultSessionID
    });
    receivedMessage.channel.send(`Moderator roles are now: ${arguments}`);
  }
}

function list_mod_roles__Command(arguments, receivedMessage) {
  if (!moderatorRoles || moderatorRoles.length == 0) {
    receivedMessage.channel.send("No moderator roles exist yet.");
  } else {
    receivedMessage.channel.send(`Moderator roles are: ${moderatorRoles}`);
  }
}

function dp_set_default_session__Command(arguments, receivedMessage) {
  if (!check_auth(receivedMessage)) {
    return;
  }

  if (arguments.length == 0) {
    receivedMessage.channel.send(
      "No session ID given. Try `!p set-default-session <sessionID>`. If you do not know the sessionID, use `!p dp-list-sessions` for a list of sessionIDs."
    );
  } else {
    setConfig({
      moderatorRoles: moderatorRoles,
      defaultSessionID: arguments[0]
    });

    receivedMessage.channel.send(
      "SessionID of " +
        defaultSessionID +
        " was set as the default session to use for the bot."
    );
  }
}

function dp_users__Command(arguments, receivedMessage) {
  if (defaultSessionID) {
    axios({
      method: "get",
      url: serverBaseURL + "/sessions/" + defaultSessionID,
      withCredentials: true,
      auth: {
        username: username,
        password: password
      }
    })
      .then(function(response) {
        // handle success
        // console.log(response);

        const onlineUsers = response.data.users
          .filter(function(userEntry) {
            return userEntry.online;
          })
          .map(function(userEntry) {
            const mod = userEntry.mod ? "moderator" : "";
            const op = userEntry.op ? "operator" : "";

            const privileges = [mod, op].reduce(function(
              accumulator,
              currentValue
            ) {
              if (accumulator) {
                accumulator = accumulator + ", ";
              }
              return accumulator + currentValue;
            });

            return (
              "\n" +
              userEntry.name +
              (privileges ? " [" + privileges + "]" : "")
            );
          });

        const data = response.data;

        const roomCode = data.listings.map(function(listingEntry) {
          return listingEntry.roomcode;
        });

        receivedMessage.channel.send(
          "__" +
            data.title +
            "__ \n" +
            "[RoomCode: " +
            roomCode +
            "] \n" +
            "[Owner: " +
            data.founder +
            "] \n\n" +
            data.userCount +
            " users currently online: " +
            onlineUsers
        );
      })
      .catch(function(error) {
        // handle error
        console.log(error);
        receivedMessage.channel.send("Unable to fetch info.");
      });
  } else {
    axios({
      method: "get",
      url: serverBaseURL + "/users/",
      withCredentials: true,
      auth: {
        username: username,
        password: password
      }
    })
      .then(function(response) {
        if (response.data.length > 0) {
          const onlineUsers = response.data.map(function(userEntry) {
            const mod = userEntry.mod ? "moderator" : "";
            const op = userEntry.op ? "operator" : "";

            const privileges = [mod, op].reduce(function(
              accumulator,
              currentValue
            ) {
              if (accumulator) {
                accumulator = accumulator + ", ";
              }
              return accumulator + currentValue;
            });

            return (
              "\n" +
              userEntry.name +
              (privileges ? " [" + privileges + "]" : "")
            );
          });

          receivedMessage.channel.send(
            "Users currently online: " + onlineUsers
          );
        } else {
          receivedMessage.channel.send(
            "There is no one on the server currently."
          );
        }
      })
      .catch(function(error) {
        console.log(error);
        receivedMessage.channel.send("Unable to fetch info.");
      });
  }
}

function dp_list_sessions__Command(arguments, receivedMessage) {
  axios({
    method: "get",
    url: serverBaseURL + "/sessions",
    withCredentials: true,
    auth: {
      username: username,
      password: password
    }
  })
    .then(function(response) {
      // handle success
      // console.log(response);
      if (response.data.length > 0) {
        const onlineSessions = response.data.map(function(sessionEntry) {
          return (
            "\n" + "Title: " + sessionEntry.title + "  ID: " + sessionEntry.id
          );
        });

        receivedMessage.channel.send(
          "Currently online sessions: " + onlineSessions
        );
      } else {
        receivedMessage.channel.send("There are no sessions available.");
      }
    })
    .catch(function(error) {
      console.log(error);
      receivedMessage.channel.send("Unable to fetch info.");
    });
}

function dp_message_all__Command(arguments, receivedMessage) {
  if (!check_auth(receivedMessage)) {
    return;
  }

  if (arguments.length === 0) {
    receivedMessage.channel.send("No message specified in the argument.");
    return;
  }

  axios({
    method: "put",
    url: serverBaseURL + "/sessions/" + defaultSessionID,
    withCredentials: true,
    auth: {
      username: username,
      password: password
    },
    headers: {
      "Content-Type": "application/json"
    },
    data: {
      message:
        "[From Discord][ " +
        receivedMessage.author.username +
        "]: " +
        arguments[0]
    }
  })
    .then(function(response) {
      // handle success
      receivedMessage.channel.send("Message sent.");
    })
    .catch(function(error) {
      // handle error
      console.log(error);
      receivedMessage.channel.send("Unable to send message.");
    });
}

function dp_alert_all__Command(arguments, receivedMessage) {
  if (!check_auth(receivedMessage)) {
    return;
  }

  if (arguments.length === 0) {
    receivedMessage.channel.send("No message specified in the argument.");
    return;
  }

  axios({
    method: "put",
    url: serverBaseURL + "/sessions/" + defaultSessionID,
    withCredentials: true,
    auth: {
      username: username,
      password: password
    },
    headers: {
      "Content-Type": "application/json"
    },
    data: {
      alert:
        "[Alert From Discord][ " +
        receivedMessage.author.username +
        "]:" +
        arguments[0]
    }
  })
    .then(function(response) {
      // handle success
      receivedMessage.channel.send("Message sent.");
    })
    .catch(function(error) {
      // handle error
      console.log(error);
      receivedMessage.channel.send("Unable to send alert.");
    });
}

client.login(bot_secret_token);
