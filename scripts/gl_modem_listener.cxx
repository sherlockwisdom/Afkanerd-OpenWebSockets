#include "declarations.hpp"

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
	cout << func_name << "=> listener called" << endl;
	
	static short int prev_modem_size = 0;
	
	while(GL_MODEM_LISTENER_STATE) {
		string str_stdout = helpers::terminal_stdout("./modem_information_extraction.sh list");
		//cout << func_name << "terminal_stdout: " << str_stdout << endl;

		if(str_stdout.empty()) cout << func_name << "=> no modems found!" << endl;
		else {
			vector<string> modem_indexes = helpers::split(str_stdout, '\n', true);
			printf("%s=> found [%lu] modems...\n", func_name.c_str(), modem_indexes.size());

			if(modem_indexes.size() != prev_modem_size) {
				cout << func_name << "=> Modem's changed! Updating pool buffer..." << endl;
				//XXX: Always keeps the container list upto date, to have this increase update time
				//MODEM_POOL.clear();
				//FIXME: Thought for commenting the line above, if the modems are put back, they can continue sending out messages immediately
			}
			prev_modem_size = modem_indexes.size();
			/* For each modem create modem folder, extract the information and store modem in MODEM_POOL */
			for(auto i : modem_indexes) {
				printf("%s=> working with index - %s\n", func_name.c_str(), i.c_str());
				//FIXME: add exception handling here
				try {
					str_stdout = helpers::terminal_stdout((string)("./modem_information_extraction.sh extract " + i));
					vector<string> modem_information = helpers::split(str_stdout, '\n', true);
					cout << func_name << "=> indexes acquired..." << endl;
					if(modem_information.size() != 3) {
						std::this_thread::sleep_for(std::chrono::seconds(5));
						continue;
					}
					cout << func_name << "=> indexes are save to parse..." << endl;
					string modem_imei = helpers::split(modem_information[0], ':')[1];
					string modem_sig_quality = helpers::split(modem_information[1], ':')[1];
					string modem_service_provider = helpers::split(modem_information[2], ':')[1]; //FIXME: What happens when cannot get ISP

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
				catch(exception& exception) {
					cout << func_name << "=> exception thrown here: " << exception.what() << endl;
				}
			}
		}

		//XXX: Sleep thread for some seconds
		//cout << func_name << "=> sleeping thread..." << flush;
		std::this_thread::sleep_for(std::chrono::seconds(5));
		//cout << " [done]" << endl;
	}
}
