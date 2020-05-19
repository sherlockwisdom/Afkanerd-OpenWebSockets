##### Client Protocols:
###### Booting [SP1]:
1. __Checks custom configuration files__ __[SP2]__ __[ FP1 ]__
    * If files are absent it exits __[ EP2 ]__
      * If files are present but incomplete or invalid
        * It complains and exists  __[ EP2 ]__

###### Connection [SP1]:
1. __Obtains MySQL connection__ __[SP2]__
    * If fails to obtain connection __[EP1]__
      * Complain and exit __[ EP2 ]__
2. __Begin connection to server__ __[SP2]__ __[EP1]__
    * If fails to connect with server __[EP1]__
      * Complain and exit __[ EP2 ]__
3. __Send authentication details to server__ __[SP2]__
    * If fails to send details to server __[EP1]__
      * Complain and exit __[ EP2 ]__
     * If fails to authenticate with server __[EP1]__
       * Complain and exit __[ EP3 ]__
4. __Begin listening to server__ __[SP2]__
    * If connection with server is lost __[EP1]__
      * Complain and return to #3 __[ EP2 ]__
    * If error with connection with server __[EP1]__
      * Complain and return to #3 __[ EP2 ]__
5. __Begin Cron messaging to server__ __[SP2]__
    * If fails to send message __[EP1]__
      * Complain and return to #3 __[ EP2 ]__

###### Request [SP1]:
1. __When obtains new request__ __[SP2]__
    * Store in DB / Write to Request file and set state as pending / return true __[SP2]__ __[EP1]__
      * If fails to store request
        * Complain __[ EP2 ]__
     * Transmit IDs to server as completed and set state as completed in database __[SP2]__ __[EP1]__
       * If fails to transmit ID
         * Complain __[ EP2 ]__
