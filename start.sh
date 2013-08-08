#!/bin/bash

gnome-terminal 	--tab -e "leapd" \
				--tab -e "node /data/ws_nodejs/leap_ctrl.node/robot_ctrl.js"  \
				--tab -e "sh /data/ws_nodejs/leap_ctrl.node/zmqwebbridge.sh" \
				--tab -e "node /data/ws_nodejs/robot_server/robot_server.js"