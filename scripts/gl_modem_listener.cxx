#include "declarations.hpp"

using namespace std;

int read_log_calculate_work_load(string modem_path) {
	string func_name = "Read Log Calculate Workload";
	cout << func_name << "=> started calculating work load" << endl;
	ifstream modem_log_read(modem_path.c_str());
	//XXX: Assumption is the file is good if it's passed in here
	string tmp_buffer;
	int total_count = 0;
	while(getline(modem_log_read, tmp_buffer)) {
		//XXX: timestamp:count
		string timestamp = helpers::split(tmp_buffer, ':')[0];
		string count = helpers::split(tmp_buffer, ':', true)[1];
		total_count += atoi(count.c_str());
	}
	modem_log_read.close();
	cout << func_name << "=> calculating work load ended..." << endl;
	return total_count;
}

void check_modem_workload(string modem_imei) {
	string func_name = "Check Modem Workload";
	cout << func_name << "=> Checking modem's workload... ";
	string modem_path = SYS_FOLDER_MODEMS + "/" + modem_imei + "/.load_balancer.dat";
	ifstream modem_log_read(modem_path.c_str());
	if(!modem_log_read.good()) {
		cout << "FAILED\n" << func_name << "=> modem hasn't begun working yet!" << endl;
	}
	else {
		cout << "DONE" << endl;
		int load_counter = read_log_calculate_work_load(modem_path);
		MODEM_WORKLOAD.insert(make_pair(modem_imei, load_counter));
		printf("DONE\n%s=> updated workload, info: imei[%s] load[%d]\n", func_name.c_str(), modem_imei.c_str(), load_counter);
		modem_log_read.close();
	}
}

void gl_modem_listener(string func_name) {
	//XXX: Make sure only 1 instance of this thread is running always
	cout << func_name << "=> listener called" << endl;
	
	short int prev_modem_size = 0;
	int iteration_counter = 0;
	
	while(GL_MODEM_LISTENER_STATE) {
		string str_stdout = helpers::terminal_stdout("./modem_information_extraction.sh list");
		//cout << func_name << "terminal_stdout: " << str_stdout << endl;

		if(str_stdout.empty()) cout << func_name << "=> no modems found!" << endl;
		else {
			vector<string> modem_indexes = helpers::split(str_stdout, '\n', true);
			printf("%s=> found [%lu] modems...\n", func_name.c_str(), modem_indexes.size());

			if(modem_indexes.size() != prev_modem_size) {
				//cout << func_name << "=> Modem's changed! Updating pool buffer..." << endl;
				//XXX: Always keeps the container list upto date, to have this increase update time
				//MODEM_POOL.clear();
				//FIXME: Thought for commenting the line above, if the modems are put back, they can continue sending out messages immediately
			}
			prev_modem_size = modem_indexes.size();
			/* For each modem create modem folder, extract the information and store modem in MODEM_POOL */
			for(auto i : modem_indexes) {
				//printf("%s=> working with index - %s\n", func_name.c_str(), i.c_str());
				try {
					str_stdout = helpers::terminal_stdout((string)("./modem_information_extraction.sh extract " + i));
					vector<string> modem_information = helpers::split(str_stdout, '\n', true);
					if(modem_information.size() != 3) {
						std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
						printf("%s=> modem information extracted - incomplete [%lu]\n", func_name.c_str(), modem_information.size());
						continue;
					}
					
					//XXX: doing something here which isn't standard - sanitation checks
					bool sanitation_check = false;
					for(auto j: modem_information) {
						if(helpers::split(j, ':', true).size() != 2) {
							cerr << func_name << "=> sanitation check failed! Could not extract modem info" << endl;
							cerr << func_name << "=> failed info: " << j << endl << endl;
							sanitation_check = false;
							break;
						} else {
							sanitation_check = true;
						}
					}
					
					if(!sanitation_check) continue;
					printf("%s=> modem information... [%s]\n", func_name.c_str(), modem_information[2].c_str());
					string modem_imei = helpers::split(modem_information[0], ':', true)[1];
					string modem_sig_quality = helpers::split(modem_information[1], ':', true)[1];
					string modem_service_provider = helpers::split(modem_information[2], ':', true)[1]; //FIXME: What happens when cannot get ISP
					printf("%s=> ISP[%s][%s] - ", func_name.c_str(), modem_service_provider.c_str(), i.c_str());
					if(mkdir((char*)(SYS_FOLDER_MODEMS + "/" + modem_imei).c_str(), STD_DIR_MODE) != 0 && errno != EEXIST) {
						char str_error[256];
						cerr << "FAILED\n" << func_name << ".error=> " << strerror_r(errno, str_error, 256) << endl;
					}
					else {
						cout << "DONE!" << endl;
						if(errno == EEXIST) {
							check_modem_workload(modem_imei);
						}

						MODEM_POOL.insert(make_pair(i, (vector<string>){modem_imei, modem_service_provider}));
						printf("%s=> updated modem pool\n%s=> update info: index[%s], imei[%s], ISP[%s]\n", func_name.c_str(), func_name.c_str(), i.c_str(), modem_imei.c_str(), modem_service_provider.c_str());
					}

				}
				catch(exception& exception) {
					cout << func_name << "=> exception thrown here: " << exception.what() << endl;
				}
			}
		}

		//XXX: Sleep thread for some seconds
		//cout << func_name << "=> sleeping thread..." << flush;
		std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
		++iteration_counter;
		if(iteration_counter == 3) GL_SYSTEM_READY = true;
		//cout << " [done]" << endl;
	}
}
