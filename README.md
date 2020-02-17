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

- Switch to server folder.

  > `cd server`

- Start server script.

  > `start main.js`

### **Client Setup**

- Switch to client folder.

  > `cd ../client`

- Start client script.

  > `start main.js`

### **Daemon setup**

Running scripts as daemons provides benefits like autorestart on failure and better log output and monitoring. To run as daemons PM2 can be used.

PM2 is a production process manager for Node.js applications with a built-in load balancer. It allows you to keep applications alive forever, to reload them without downtime and to facilitate common system admin tasks.

[Learn more](https://www.npmjs.com/package/pm2)
