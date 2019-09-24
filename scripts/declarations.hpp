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

#include "helpers.hpp"

using namespace std;
/* GLOBAL SYSTEM DECLARATIONS */
bool GL_MODEM_LISTENER_STATE = true;
string ENV_HOME = getenv("HOME");
string SYS_FOLDER = ENV_HOME + "/deku";
string SYS_FOLDER_MODEMS = SYS_FOLDER + "/modems";
string SYS_REQUEST_FILE = SYS_FOLDER + "/request_queue.dat";

mode_t STD_DIR_MODE = 0777;

map<string, vector<string>> MODEM_POOL;
map<string, int> MODEM_WORKLOAD;

#endif
