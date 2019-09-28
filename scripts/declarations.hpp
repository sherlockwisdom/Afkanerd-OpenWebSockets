#ifndef DECLARATIONS_H_INCLUDED_
#define DECLARATIONS_H_INCLUDED_

#include <iostream>
#include <thread>
#include <cstdio> //Testing if threads work in same dir
#include <vector>
#include <chrono>
#include <stdio.h>
#include <sys/stat.h> //mkdir
#include <errno.h>
#include <string.h>
#include <map>
#include <fstream>
#include <string>

#include "helpers.hpp"

using namespace std;
/* GLOBAL SYSTEM DECLARATIONS */
bool GL_MODEM_LISTENER_STATE = true;
bool GL_SYSTEM_READY = false;
int GL_TR_SLEEP_TIME = 5;
int GL_MMCLI_MODEM_SLEEP_TIME = 30;
string GL_SSH_IP_GATEWAY = "192.168.";
string ENV_HOME = getenv("HOME");
string SYS_FOLDER = ENV_HOME + "/deku";
string SYS_FOLDER_MODEMS = SYS_FOLDER + "/modems";
string SYS_REQUEST_FILE = SYS_FOLDER + "/request_queue.dat";
string SYS_JOB_FILE = SYS_FOLDER + "/current_job.dat";

mode_t STD_DIR_MODE = 0777;

//INDEX -> <IMEI,LOADCOUNT>
map<string, vector<string>> MODEM_POOL;


//IMEI -> load count
map<string, int> MODEM_WORKLOAD;


//IMEI -> initialized
map<string, bool> MODEM_DAEMON;

#endif
