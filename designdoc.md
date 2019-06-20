##Drawpile Discord Bot, PedroOS (DDBP)

####Objective & Scope
The scope is that each bot will be made for only one Discord and Drawpile server pair. 

####Purpose & Functional Requirements
This program allows server status checking and administration within Discord.
1. [Owner] Set what roles on the discord server are moderator positions.
2. [Moderator] set default session within the server. 
3. [All] Check which users on the session are online.
4. [Moderator] Set welcome message
5. [Moderator] Change session title
6. [Moderator] Register a moderator drawpile account. The moderator will be DMed a username and password to use. 



####Target Audience
Owners of discord servers who also have a Drawpile server.

####Technology Requirements
DDBP uses Node.js, Axios.js, Discord.js, and Drawpile's server admin API. As a warning, due to possible changes to Drawpile's server admin API, this app could easily become obsolete.   

####Deployment
The app can be deployed on any machine with NodeJS installed. It can be downloaded to any machine using a git clone command. You can run it indefinitely by using forever.js. Some nice server options are a cloud service like AWS or using a local low-energy machine like a Raspberry Pi. 