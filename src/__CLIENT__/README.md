###### Client Protocols:
###### Booting:
1. __Checks custom configuration files__
  * If files are absent it exits
    * If files are present but incomplete or invalid
    * It complains and exists

###### Connection:
1. __Obtains MySQL connection__
  * If fails to obtain connection
    * Complain and exit
2. __Begin connection to server__
  * If fails to connect with server
    * Complain and exit
3. __Send authentication details to server__
  * If fails to send details to server
    * Complain and exit
  * If fails to authenticate with server
    * Complain and exit
4. __Begin listening to server__
  * If connection with server is lost
    * Complain and return to #3
  * If error with connection with server
    * Complain and return to #3
5. __Begin Cron messaging to server__
  * If fails to send message
    * Complain and return to #3
    
###### Request:
- __When obtains new request__
  * Store in DB / Write to Request file and set state as pending / return true
    * If fails to store request
      * Complain
- __Transmit IDs to server as completed and set state as completed in database__
  * If fails to transmit ID
    * Complain
