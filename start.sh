#!/bin/bash

gnome-terminal \
	--tab -e "leapd" \
	--tab -e "node robot_ctrl.js"  \
	--tab -e "sh zmqwebbridge.sh" \
	--tab -e "node ../robot_server/robot_server.js"