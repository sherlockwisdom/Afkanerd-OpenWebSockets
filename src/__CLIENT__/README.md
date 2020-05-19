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
Complain and exit [ EP3 ]
Begin listening to server [SP2]
If connection with server is lost [EP1]
Complain and return to #3 [ EP2 ]
If error with connection with server [EP1]
Complain and return to #3 [ EP2 ]
Begin Cron messaging to server [SP2]
If fails to send message [EP1]
Complain and return to #3 [ EP2 ]

Request [SP1]:
When obtains new request [SP2] 
Store in DB / Write to Request file and set state as pending / return true [SP2] [EP1]
If fails to store request
Complain [ EP2 ]
Transmit IDs to server as completed and set state as completed in database [SP2] [EP1]
If fails to transmit ID
Complain [ EP2 ]
