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
string SYS_FOLDER = ENV_HOME + "/deku";
string SYS_FOLDER_MODEMS = SYS_FOLDER + "/modems";


mode_t STD_DIR_MODE = 0777;

void gl_modem_listener(string func_name) {
	//XXX: Make sure only 1 instance of this thread is running always
	cout << func_name << "listener called" << endl;
	
	
	while(GL_MODEM_LISTENER_STATE) {
		string str_stdout = helpers::terminal_stdout("./modem_information_extraction.sh list");
		//cout << func_name << "terminal_stdout: " << str_stdout << endl;

		if(str_stdout.empty()) cout << func_name << "=> no modems found!" << endl;
		else {
			vector<string> modem_indexes = helpers::split(str_stdout, '\n', true);
			printf("%s=> found [%lu] modems...\n", func_name.c_str(), modem_indexes.size());

			for(auto i : modem_indexes) {
				//FIXME: add exception handling here
				str_stdout = helpers::terminal_stdout((string)("./modem_information_extraction.sh extract " + i));
				vector<string> modem_information = helpers::split(str_stdout, '\n', true);
				string modem_imei = helpers::split(modem_information[0], ':', true)[1];
				string modem_sig_quality = helpers::split(modem_information[1], ':', true)[1];
				string modem_service_provider = helpers::split(modem_information[2], ':', true)[1];

				printf("%s=> creating folder[%s]: ...", func_name.c_str(), modem_imei.c_str());
				if(mkdir((char*)(SYS_FOLDER_MODEMS + "/" + modem_imei).c_str(), STD_DIR_MODE) != 0 && errno != EEXIST) {
					char str_error[256];
					cerr << "FAILED\n" << func_name << ".error=> " << strerror_r(errno, str_error, 256) << endl;
				}
				else cout << "DONE!" << endl;
			}
		}
		cout << func_name << "=> sleeping thread..." << flush;
		std::this_thread::sleep_for(std::chrono::seconds(5));
		cout << " [done]" << endl;
	}
}

bool check_system_folders() {
	int result = mkdir(SYS_FOLDER.c_str(), STD_DIR_MODE);
	if(result == 0 || errno == EEXIST) cout << "check_system_folder=> $HOME/deku = DONE" << endl;
	else {
		char str_error[256];
		string error_message = strerror_r( errno, str_error, 256);
		cerr << "check_system_folder.error=> creating /deku/... " << error_message << endl;
		return false;
	}

	result = mkdir(SYS_FOLDER_MODEMS.c_str(), STD_DIR_MODE);
	if(result == 0 || errno == EEXIST) cout << "check_system_folder=> $HOME/deku/modems = DONE" << endl;
	else {
		char str_error[256];
		string error_message = strerror_r( errno, str_error, 256);
		cerr << "check_system_folder.error=> creating /modems/... " << error_message << endl;
		return false;
	}
	return true;
}

int main() {
	//thread a listener that creates a dir when a new modem is plugged in and updates system modem pool
	//thread a listener that listens for changes to request files and calculate work load and distributes to modems
	//main process spins of threads and manages them
	
	//checks and create defaults before begining the threads
	if( !check_system_folders()) {
		return 1;
	}


	std::thread tr_modem_listener(gl_modem_listener, "Master Modem Listener");
	tr_modem_listener.join();

	return 1;
}
