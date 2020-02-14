# Afkanerd-OpenWebSockets

## **Setup and Config**

### **Global config**

- Clone or download repository to local machine.

  > `git clone https://github.com/Wisdom-Nji/Afkanerd-OpenWebSockets.git`

- Install dependencies with npm.

  > `npm install`

- Grant execute permission to install script.

  > `sudo chmod 777 install.sh`

- Run install script to configure client.

  > `sudo ./install.sh`

### **Server Setup**

- Switch to server folder.

  > `cd server`

- Start server script with pm2.

  > `pm2 start main.js -n "name your server instance"`

- To view server log run pm2 log "number assigned to server instance by pm2 here".

  > `pm2 log 0`

### **Client Setup**

- Switch to client folder.

  > `cd ../client`

- Start client script with pm2.

  > `pm2 start main.js -n "name your client instance"`

- To view client log run pm2 log "number assigned to client instance by pm2 here".

  > `pm2 log 1`
