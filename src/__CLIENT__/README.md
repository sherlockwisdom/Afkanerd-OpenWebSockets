###### Client Protocols:
###### Booting:
1. Checks custom configuration files
  * If files are absent it exits
    * If files are present but incomplete or invalid
    * It complains and exists

###### Connection:
1. Obtains MySQL connection
  * If fails to obtain connection
    * Complain and exit
2. Begin connection to server
  * If fails to connect with server
    * Complain and exit
3. Send authentication details to server
  * If fails to send details to server
    * Complain and exit
  * If fails to authenticate with server
    * Complain and exit
4. Begin listening to server
  * If connection with server is lost
    * Complain and return to #3
  * If error with connection with server
    * Complain and return to #3
5. Begin Cron messaging to server
  * If fails to send message
    * Complain and return to #3
