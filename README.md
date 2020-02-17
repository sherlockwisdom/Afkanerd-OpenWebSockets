# Afkanerd-OpenWebSockets

## **Setup and Config**

### **Global config**

- Clone or download repository to local machine.

  > `git clone https://github.com/Wisdom-Nji/Afkanerd-OpenWebSockets.git`

- Install dependencies with npm.

  > `npm install`

- Grant execute permission to install script.

  > `chmod a+x install.sh`

- Run install script to configure client.

  > `./install.sh`

### **Server Setup**

- Start server script.

  > `npm run start-server`

### **Client Setup**

- Start client script.

  > `npm run start-client`

### **Daemon setup**

Running scripts as daemons provides benefits like autorestart on failure and better log output and monitoring. To run as daemons, [PM2](https://www.npmjs.com/package/pm2), [forever](https://www.npmjs.com/package/forever), [nodemon](https://www.npmjs.com/package/nodemon) and [supervisor](https://www.npmjs.com/package/supervisor) can be used.
