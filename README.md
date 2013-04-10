# Robot Remote Control

This node provides Remote Control for a Robot over a Web Browser using ZMQ and WebSockets. In particular, it uses node.js and express to provide an HTML page which can be accessed over a web browser. Remote Controls and Video Data are sent and received on the browser over WebSockets. The WebSockets are connected to a [ZmqWebBridge]() which is a python script creating a bridge between WebSockets and ZMQ. The ZmqWebBridge creates ZMQ Connections to a node serving as a Robot Server, providing ZMQ Sockets for Command and Video, see [Robot Server](). The robot which is to be controlled has to provide ZMQ Sockets to receive Command and send Video Messages. As an example see our [RomoBrain app]() which we use to control a Romo. The definition of the messages is described in the protocol document [here]().

A complete showcase application to control a Romo over a Web Browser is presented on our blog [here]().

## Run

1. Start the Robot Server (see [here]() for an explanation on how to do this).

2. Start the ZmqWebBridge

	$ ./zmqwebbridge.sh

3. At the same location, start the web server. 

	$ node robot_ctrl

Note: if the Robot Server is not run at the same location as the web server and ZmqWebBridge, then the variable zmqServerAddress in static/scripts.js has to be changed accordingly.

4. Use a web browser to connect to http://{SERVER_ADDRESS}:3000, where {SERVER_ADDRESS} is the adress where the ZmqWebBridge and web server are running, e.g. http://localhost:3000