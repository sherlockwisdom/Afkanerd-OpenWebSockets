#include "declarations.hpp"

using namespace std;


//TODO: Make work load checking functional
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
		//cout << "FAILED\n" << func_name << "=> modem hasn't begun working yet!" << endl;
		cout << "DONE" << endl;
	}
	else {
		cout << "DONE" << endl;
		int load_counter = read_log_calculate_work_load(modem_path);
		MODEM_WORKLOAD.insert(make_pair(modem_imei, load_counter));
		printf("DONE\n%s=> updated workload, info: imei[%s] load[%d]\n", func_name.c_str(), modem_imei.c_str(), load_counter);
		modem_log_read.close();
	}
}


void configure_ssh_modems( string ip_gateway ) {
	string func_name = "Configure SSH Modems";
	//verify ssh is actually a modem
	string ssh_stdout = helpers::terminal_stdout((string)("ssh root@" + ip_gateway + " -T -o \"ConnectTimeout=10\" deku"));
	//cout << func_name << "=> ssh output: " << ssh_stdout << endl;
	vector<string> ssh_stdout_lines = helpers::split(ssh_stdout, '\n', true);
	if(ssh_stdout_lines[0] == "deku:verified:") {
		cout << func_name << "=> SSH server ready for SMS!" << endl;
		if(mkdir((char*)(SYS_FOLDER_MODEMS + "/" + ip_gateway).c_str(), STD_DIR_MODE) != 0 && errno != EEXIST) {
			char str_error[256];
			cerr << func_name << ".error=> " << strerror_r(errno, str_error, 256) << endl;
		}
		else {
			if(errno == EEXIST) {
				check_modem_workload(ip_gateway);
			}

			MODEM_POOL.insert(make_pair(ip_gateway, (vector<string>){ip_gateway, ssh_stdout_lines[1]}));
			printf("%s=> updated modem pool for SSH\n%s=> update info: ip[%s], ISP[%s]\n", func_name.c_str(), func_name.c_str(), ip_gateway.c_str(), ssh_stdout_lines[1].c_str());
		}
	}
	else {
		cout << func_name << "=> Could not verify SSH server!" << endl;
	}
}


void modem_extractor(string func_name, string i ) {
	string str_stdout = helpers::terminal_stdout((string)("./modem_information_extraction.sh extract " + i));
	vector<string> modem_information = helpers::split(str_stdout, '\n', true);
	if(modem_information.size() != 3) {
		std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
		printf("%s=> modem information extracted - incomplete [%lu]\n", func_name.c_str(), modem_information.size());
		return;
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
	
	if(!sanitation_check) return;
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


void gl_modem_listener(string func_name) {
	//XXX: Make sure only 1 instance of this thread is running always
	cout << func_name << "=> listener called" << endl;
	int iteration_counter = 0;
	
	while(GL_MODEM_LISTENER_STATE) {
		string str_stdout = helpers::terminal_stdout("./modem_information_extraction.sh list");
		//cout << func_name << "terminal_stdout: " << str_stdout << endl;

		if(str_stdout.empty()) cout << func_name << "=> no modems found!" << endl;
		else {
			vector<string> modem_indexes = helpers::split(str_stdout, '\n', true);
			//printf("%s=> found [%lu] modems...\n", func_name.c_str(), modem_indexes.size());

			/* For each modem create modem folder, extract the information and store modem in MODEM_POOL */
			for(auto i : modem_indexes) {
				//printf("%s=> working with index - %s\n", func_name.c_str(), i.c_str());
				try {
					if(i.find(GL_SSH_IP_GATEWAY) != string::npos) {
						printf("%s=> found SSH MODEM :[%s]\n", func_name.c_str(), i.c_str());
						std::thread tr_ssh_extractor(configure_ssh_modems, i);
						tr_ssh_extractor.detach();
						continue;
					}
					
					std::thread tr_modem_extractor(modem_extractor, "Modem Extractor", i);
					tr_modem_extractor.detach();

				}
				catch(exception& exception) {
					cout << func_name << "=> exception thrown here: " << exception.what() << endl;
				}
			}
		}

		//XXX: Sleep thread for some seconds
		//cout << func_name << "=> sleeping thread..." << flush;
		std::this_thread::sleep_for(std::chrono::seconds(10)); //XXX: Change this to a const isn't the best to have it as it is
		++iteration_counter;
		if(iteration_counter == 3) GL_SYSTEM_READY = true;
		MODEM_POOL.clear();
		//cout << " [done]" << endl;
	}
}
