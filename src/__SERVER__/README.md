##### Server Protocols:
###### Booting [SP1]:
1. __Checks custom configuration files__ __[SP2]__ __[EP1]__ __[ FP1 ]__
    * If files are absent __[SP2]__
      * It complains and exits __[EP2]__
    * If files are present but incomplete or invalid 
      * It complains and exists __[EP2]__

###### Connection [SP1]:
1. __Obtains MySQL connection__ __[SP2]__
    * If fails to obtain connection __[EP1]__
      * Complain and exit __[EP2]__
2. __Begin connection to server__ __[SP2]__
    * If fails to connect with server __[EP1]__
      * Complain and exit __[EP2]__
3. __Begin listening for clients__ __[SP2]__
    * If connection with client is lost __[EP1]__
      * Complain and return to #3 __[EP2]__
    * If error with connection with client __[EP1]__
      * Complain and return to #3 __[EP2]__

###### Request for client [SP1]:
1. __When obtains new request__ __[SP2]__
    * Store in DB / Write to Request file and set state as pending / return true __[SP2]__
      * If fails to store request __[EP1]__
        * Complain __[EP2]__
    * Transmit IDs to client __[SP2]__
      * If fails to transmit __[EP1]__
        * If Client not found __[EP2]__
          * Complain and exit __[EP2]__
        * If error __[EP2]__
          * Complain and exit __[EP2]__
    * Set state as transmitted for IDs __[SP2]__
      * If fails to change state __[EP1]__
        * Complain __[EP2]__
