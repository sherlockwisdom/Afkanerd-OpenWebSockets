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


int read_log_calculate_work_load(string modem_path) {
	ifstream modem_log_read(modem_path.c_str());
	//XXX: Assumption is the file is good if it's passed in here
	string tmp_buffer;
	int total_count = 0;
	while(getline(modem_log_read, tmp_buffer)) {
		//XXX: timestamp:count
		string timestamp = helpers::split(tmp_buffer, ':', true)[0];
		string count = helpers::split(tmp_buffer, ':', true)[1];
		total_count += atoi(count.c_str());
	}
	modem_log_read.close();
	return total_count;
}

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

			/* For each modem create modem folder, extract the information and store modem in MODEM_POOL */
			for(auto i : modem_indexes) {
				//FIXME: add exception handling here
				str_stdout = helpers::terminal_stdout((string)("./modem_information_extraction.sh extract " + i));
				vector<string> modem_information = helpers::split(str_stdout, '\n', true);
				string modem_imei = helpers::split(modem_information[0], ':', true)[1];
				string modem_sig_quality = helpers::split(modem_information[1], ':', true)[1];
				string modem_service_provider = helpers::split(modem_information[2], ':', true)[1]; //FIXME: What happens when cannot get ISP

				printf("%s=> creating folder[%s]: ...", func_name.c_str(), modem_imei.c_str());
				if(mkdir((char*)(SYS_FOLDER_MODEMS + "/" + modem_imei).c_str(), STD_DIR_MODE) != 0 && errno != EEXIST) {
					char str_error[256];
					cerr << "FAILED\n" << func_name << ".error=> " << strerror_r(errno, str_error, 256) << endl;
				}
				else {
					cout << "DONE!" << endl;
					if(errno == EEXIST) {
						string modem_path = SYS_FOLDER_MODEMS + "/" + modem_imei + "/.load_balancer.dat";
						ifstream modem_log_read(modem_path.c_str());
						if(!modem_log_read.good()) {
							cout << func_name << "=> modem hasn't begun working yet!" << endl;
						}
						else {
							int load_counter = read_log_calculate_work_load(modem_path);
							MODEM_WORKLOAD.insert(make_pair(modem_imei, load_counter));
							printf("%s=> updated workload, info: imei[%s] load[%d]\n", func_name.c_str(), modem_imei.c_str(), load_counter);
							modem_log_read.close();
						}
					}	

					MODEM_POOL.insert(make_pair(i, (vector<string>){modem_imei, modem_service_provider}));
					printf("%s=> updated modem pool\n%s=> update info: index[%s], imei[%s], ISP[%s]\n%s=> Pool count: %lu\n", func_name.c_str(), func_name.c_str(), i.c_str(), modem_imei.c_str(), modem_service_provider.c_str(), func_name.c_str(), MODEM_POOL.size());
				}
			}
		}

		//XXX: Sleep thread for some seconds
		cout << func_name << "=> sleeping thread..." << flush;
		std::this_thread::sleep_for(std::chrono::seconds(5));
		cout << " [done]" << endl;
	}
}


/* THREAD LISTENING FOR INCOMING REQUEST */
void gl_request_queue_listener(string func_name) {
	//FIXME: Only 1 of this should be running at any moment
	ifstream sys_request_file_read(SYS_REQUEST_FILE.c_str());
	
	if(!sys_request_file_read.good()) {
		cout << func_name << "=> no request file, thus no request yet..." << endl;
	}

	else {
		string tmp_ln_buffer;
		//XXX: Container contains maps which have keys as number and message
		vector<map<string,string>> request_tuple_container;
		while(getline(sys_request_file_read, tmp_ln_buffer)) {
			printf("%s=> request line: [%s]\n", func_name.c_str(), tmp_ln_buffer.c_str());
			//XXX: calculate work load - assumption is simcards in modems won't be changed! So calculations go to modem
			//XXX: custom parser
			cout << func_name << "=> parsing request...";
			string tmp_string_buffer = "";
			string tmp_key = "";
			map<string, string> request_tuple;
			for(auto i : tmp_ln_buffer) {
				static bool ignore = false;
				//XXX: checks for seperator
				if(i == ':' and !ignore) {
					tmp_key = tmp_string_buffer;
					tmp_string_buffer = "";
					continue;
				}
				if(i == ',' and !ignore) {
					request_tuple.insert(make_pair(tmp_key, tmp_string_buffer));
					tmp_string_buffer = "";
					continue;
				}
				if(i == '"') {
					ignore = !ignore;
					continue;
				}
				tmp_string_buffer += i;
			}
			if(!tmp_key.empty()) request_tuple.insert(make_pair(tmp_key, tmp_string_buffer));
			cout << "DONE!" << endl;
			for(auto j : request_tuple) printf("%s=> REQUEST-TUPLE: [%s => %s]\n", func_name.c_str(), j.first.c_str(), j.second.c_str());
			request_tuple_container.push_back(request_tuple);
		}
		//XXX: Distribute work to each modem based on how much workload
		printf("%s=> Work load analysis: #of request[%lu]\n", func_name.c_str(), request_tuple_container.size());
	}
	sys_request_file_read.close();
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
	std::thread tr_request_listener(gl_request_queue_listener, "Request Queue Listener");
	tr_modem_listener.join();

	return 1;
}
