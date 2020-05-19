##### Server Protocols:
###### Booting [SP1]:
1. __Checks custom configuration files [SP2] [EP1] [ FP1 ]
    * If files are absent [SP2]
      * It complains and exits [EP2]
    * If files are present but incomplete or invalid 
      * It complains and exists [EP2]

###### Connection [SP1]:
1. Obtains MySQL connection [SP2]
    * If fails to obtain connection [EP1]
      * Complain and exit [EP2]
2. Begin connection to server [SP2]
    * If fails to connect with server [EP1]
      * Complain and exit [EP2]
3. Begin listening for clients [SP2]
    * If connection with client is lost [EP1]
      * Complain and return to #3 [EP2]
    * If error with connection with client [EP1]
      * Complain and return to #3 [EP2]

###### Request for client [SP1]:
1. When obtains new request [SP2]
    * Store in DB / Write to Request file and set state as pending / return true [SP2]
      * If fails to store request [EP1]
        * Complain [EP2]
    * Transmit IDs to client [SP2]
      * If fails to transmit [EP1]
        * If Client not found [EP2]
          * Complain and exit [EP2]
        * If error [EP2]
          * Complain and exit [EP2]
    * Set state as transmitted for IDs [SP2]
If fails to change state [EP1]
Complain [EP2]
