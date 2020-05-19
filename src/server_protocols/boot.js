/*
##### Server Protocols:
###### Booting [SP1]:
1. __Checks custom configuration files__ __[SP2]__ __[EP1]__ __[ FP1 ]__
    * If files are absent __[SP2]__
      * It complains and exits __[EP2]__
    * If files are present but incomplete or invalid 
      * It complains and exists __[EP2]__
*/


const envFileReader = require('dotenv');

var filePath_sysConfig = // TODO: Read this as terminal argument
envFileReader.config(
	{ 
		path : filePath_sysConfig.toString() 
	})


