#include <iostream>
#include <thread>
#include <cstdio> //Testing if threads work in same dir
#include <vector>
#include <chrono>
#include <stdio.h>
#include <sys/stat.h> //mkdir
#include <errno.h>
#include <string.h>

#include "helpers.hpp"
using namespace std;

bool GL_MODEM_LISTENER_STATE = true;
string ENV_HOME = getenv("HOME");
string SYS_FOLDER = ENV_HOME + "/deku/";

void gl_modem_listener(string func_name) {
	//TODO: Make sure only 1 instance of this thread is running always
	cout << func_name << "listener called" << endl;

	//cout << func_name << " << getenv("PWD") << endl; //Yep works in same same directory as main thread
	
	string str_stdout = helpers::terminal_stdout("./modem_information_extraction.sh list");
	//cout << func_name << "terminal_stdout: " << str_stdout << endl;
	
	while(GL_MODEM_LISTENER_STATE) {
		if(str_stdout.empty()) cout << func_name << "=> no modems found!" << endl;
		else {
			vector<string> modem_indexes = helpers::split(str_stdout, '\n', true);
			printf("%s=> found [%lu] modems...\n", func_name.c_str(), modem_indexes.size());
		}
		cout << func_name << "=> sleeping thread..." << flush;
		std::this_thread::sleep_for(std::chrono::seconds(5));
		cout << " [done]" << endl;
	}
}

void check_system_folder() {
	int result = mkdir(SYS_FOLDER.c_str(), 777);
	if(result == 0 || errno == EEXIST) cout << "check_system_folder=> done" << endl;
	else {
		char str_error[256];
		//cerr << "check_system_folder=> an error occured" << endl;
		string error_message = strerror_r( errno, str_error, 256);
		cerr << "check_system_folder.error=> " << error_message << endl;
		//printf("check_system_folder.error=> %s", str_error);
	}
}

int main() {
	//thread a listener that creates a dir when a new modem is plugged in and updates system modem pool
	//thread a listener that listens for changes to request files and calculate work load and distributes to modems
	//main process spins of threads and manages them
	
	//checks and create defaults before begining the threads
	check_system_folder();


	std::thread tr_modem_listener(gl_modem_listener, "Master Modem Listener");
	tr_modem_listener.join();

	return 1;
}
