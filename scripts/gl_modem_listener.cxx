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
		string timestamp = helpers::split(tmp_buffer, ':', true)[0];
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


void modem_cleanse( string imei ) {
	map<string,string>::iterator it_modem_daemon = MODEM_DAEMON.find(imei);
	if(it_modem_daemon != MODEM_DAEMON.end()) 
		MODEM_DAEMON.erase( it_modem_daemon );
}


inline vector<string> get_modems_jobs(string folder_name) {
	return helpers::split( helpers::terminal_stdout((string)("ls -1 " + folder_name)), '\n', true );
}

void modem_listener(string func_name, string modem_imei, string modem_index, string ISP, bool watch_dog = true, string type = "MMCLI") {
	//XXX: Just 1 instance should be running for every modem_imei
	printf("%s=> Started instance of modem\n\t+imei[%s] +index[%s] +isp[%s] +type[%s]\n", func_name.c_str(), modem_imei.c_str(), modem_index.c_str(), ISP.c_str(), type.c_str());
	MODEM_DAEMON.insert(make_pair(modem_imei, ISP));

	while(GL_MODEM_LISTENER_STATE) {

		if(watch_dog) {
			if(!helpers::modem_is_available( modem_imei ) ) {
				printf("%s=> Killed instance of modem because disconncted\n\t+imei[%s] +index[%s] +isp[%s] +type[%s]\n", func_name.c_str(), modem_imei.c_str(), modem_index.c_str(), ISP.c_str(), type.c_str());
				modem_cleanse( modem_imei );
				break;
			}
		}
		//read the modems folder for changes
		vector<string> jobs = get_modems_jobs((string)(SYS_FOLDER_MODEMS + "/" + modem_imei));

		printf("%s=> [%lu] found jobs...\n", func_name.c_str(), jobs.size());
		for(auto filename : jobs) {
			string full_filename = SYS_FOLDER_MODEMS + "/" + modem_imei + "/" + filename;
			printf("%s=> EXECUTING JOB FOR FILE: %s\n", func_name.c_str(), full_filename.c_str());
			ifstream read_job(full_filename.c_str());
			if(!read_job) {
				cerr << func_name << "=> error reading job: " << filename << endl;
				continue;
			}

			string tmp_buffer, number, message = "";
			short int line_counter = 0;
			while(getline(read_job, tmp_buffer)) {
				if(line_counter == 0) number = tmp_buffer;
				else if(line_counter > 0) {
					message += "\n" + tmp_buffer;
					line_counter = 0;
				}
				++line_counter;
			}

			read_job.close();
			//printf("%s=> processing job: number[%s], message[%s]\n", func_name.c_str(), number.c_str(), message.c_str());
			
			//XXX: Lord Help me
			if(type == "MMCLI") {
				string sms_command = "./modem_information_extraction.sh sms send \"" + message + "\" " + number + " " + modem_index;
				string terminal_stdout = helpers::terminal_stdout(sms_command);
				cout << func_name << "=> sending sms message...\n" << func_name << "=> \t\tStatus " << terminal_stdout << endl << endl;
				if(terminal_stdout.find("success") == string::npos or terminal_stdout.find("Success") == string::npos) {
					printf("%s=> Modem needs to sleep... going down for 30 seconds\n", func_name.c_str());
					std::this_thread::sleep_for(std::chrono::seconds(GL_MMCLI_MODEM_SLEEP_TIME));
				}
			}

			else if(type == "SSH") {
				string sms_command = "ssh root@" + modem_index + " -T -o \"ConnectTimeout=20\" \"sendsms '" + number + "' \\\"" + message + "\\\"\"";
				//cout << func_name << "=> SSH COMMAND: " << sms_command << endl;
				string terminal_stdout = helpers::terminal_stdout(sms_command);
				cout << func_name << "=> sending sms message...\n" << func_name << "=> \t\tStatus " << terminal_stdout << endl << endl;

			}

			//TODO: Check if message failed or was successful
			//TODO: If a serial timeout message, sleep modem for and give it time to solve it's problems
			//TODO: Get error messages from the list provided the last time or wherever they've been kept

			//Deleting the job file
			if( remove(full_filename.c_str()) != 0 ) {
				cerr << func_name << "=> failed to delete job!!!!!" << endl;
				char str_error[256];
				cerr << func_name << "=> errno message: " << strerror_r(errno, str_error, 256) << endl;
			}
			else { //XXX: Storing workload
				string timestamp = helpers::split( helpers::terminal_stdout("date +%s"), '\n')[0];
				string load_balancer = SYS_FOLDER_MODEMS + "/" + modem_imei + "/.load_balancer.dat";
				ofstream write_to_work_load(load_balancer.c_str(), ios::app);
				write_to_work_load << timestamp << ":1" << endl;
				write_to_work_load.close();
			}

		}

		std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
	}

	return;
}


void ssh_extractor( string ip_gateway ) {
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
				//check_modem_workload(ip_gateway);
			}

			//MODEM_POOL.insert(make_pair(ip_gateway, (vector<string>){ip_gateway, ssh_stdout_lines[1]}));
			//printf("%s=> updated modem pool for SSH\n%s=> update info: ip[%s], ISP[%s]\n", func_name.c_str(), func_name.c_str(), ip_gateway.c_str(), ssh_stdout_lines[1].c_str());

			if(MODEM_DAEMON.find(ip_gateway) != MODEM_DAEMON.end()) {
				cout << func_name << "=> Instance of SSH already running... watch dog reset!" << endl;

				std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
				return;
			}

			std::thread tr_ssh_listener(modem_listener, "\tSSH Listener", ip_gateway, ip_gateway, ssh_stdout_lines[1], true, "SSH");
			tr_ssh_listener.detach();
		}
	}
	else {
		cout << func_name << "=> Could not verify SSH server!" << endl;
	}

	return;
}


void modem_extractor(string func_name, string modem_index ) {
	string str_stdout = helpers::terminal_stdout((string)("./modem_information_extraction.sh extract " + modem_index));
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
	//printf("%s=> modem information... [%s]\n", func_name.c_str(), modem_information[2].c_str());
	string modem_imei = helpers::split(modem_information[0], ':', true)[1];
	//XXX: Check if another an instance of the modem is already running
	if(MODEM_DAEMON.find(modem_imei) != MODEM_DAEMON.end()) {
		cout << func_name << "=> Instance of Modem already running... watch dog reset!" << endl;

		std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
		return;
	}
	string modem_sig_quality = helpers::split(modem_information[1], ':', true)[1];
	string modem_service_provider = helpers::split(modem_information[2], ':', true)[1]; //FIXME: What happens when cannot get ISP
	printf("%s=> +ISP[%s] +index[%s] - ", func_name.c_str(), modem_service_provider.c_str(), modem_index.c_str());
	if(mkdir((char*)(SYS_FOLDER_MODEMS + "/" + modem_imei).c_str(), STD_DIR_MODE) != 0 && errno != EEXIST) {
		char str_error[256];
		cerr << "FAILED\n" << func_name << ".error=> " << strerror_r(errno, str_error, 256) << endl;
	}
	else {
		cout << "DONE!" << endl;
		if(errno == EEXIST) {
			check_modem_workload(modem_imei);
		}

		//MODEM_POOL.insert(make_pair(i, (vector<string>){modem_imei, modem_service_provider}));
		//printf("%s=> updated modem pool\n%s=> update info: index[%s], imei[%s], ISP[%s]\n", func_name.c_str(), func_name.c_str(), i.c_str(), modem_imei.c_str(), modem_service_provider.c_str());

		std::thread tr_modem_listener(modem_listener, "\tModem Listener", modem_imei, modem_index, modem_service_provider, true, "MMCLI");
		tr_modem_listener.detach();
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
						std::thread tr_ssh_extractor(ssh_extractor, i);
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
		//MODEM_POOL.clear();
		//cout << " [done]" << endl;
	}
}
