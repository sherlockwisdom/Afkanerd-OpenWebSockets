#!/bin/bash

#This is an installation script to guide through installation

echo -e "AFKANERD DEKU - System Installation Script\n------------------------------------------\n"

CLIENT_TOKEN=
CLIENT_UUID=
TCP_HOST_NAME="afkanerd.com"
TCP_HOST_PORT="8080"
APP_TYPE="sms"
DEKU_DEFAULT_DIR="$HOME/deku/"

read -p "Enter client ACCESS-TOKEN: " CLIENT_TOKEN
read -p "Enter client UUID: " CLIENT_UUID
read -p "Enter Host Address[default=afkanerd.com] " TCP_HOST_NAME
if [ -z "$TCP_HOST_NAME" ] ; then
	TCP_HOST_NAME="afkanerd.com"
fi
read -p "Enter Host port[default=8080] " TCP_HOST_PORT
if [ -z "$TCP_HOST_PORT" ]; then
	TCP_HOST_PORT="8080"
fi
read -p "Enter App Type[default=sms] " APP_TYPE
if [ -z "$APP_TYPE" ] ; then
	APP_TYPE="sms"
fi
echo -e "Configuring system with ACCESS-TOKEN[$CLIENT_TOKEN], UUID[$CLIENT_UUID], TCP_HOST_NAME[$TCP_HOST_NAME], TCP_HOST_PORT[$TCP_HOST_PORT], APP_TYPE[$APP_TYPE]\n"
echo -e "--->[INFO] - You can always run this script in case of any errors\n"

mkdir -p $DEKU_DEFAULT_DIR
echo -e "TCP_HOST_NAME=$TCP_HOST_NAME\nTCP_HOST_PORT=$TCP_HOST_PORT\nCLIENT_TOKEN=$CLIENT_TOKEN\nCLIENT_UUID=$CLIENT_UUID\nAPP_TYPE=$APP_TYPE" > $DEKU_DEFAULT_DIR/whoami.env


if [ -f "$DEKU_DEFAULT_DIR/whoami.env" ] ; then
	echo -e "Alright, Deku installed all done... you can begin the PM2 load managers now\n"
else
	echo -e "Something went wrong while installing Deku, please verify and try again, importantly the file wasn't found\n"
fi
