#include "declarations.hpp"

using namespace std;


inline vector<string> get_modems_jobs(string folder_name) {
	return helpers::split( helpers::terminal_stdout((string)("ls -1 " + folder_name)), '\n', true );
}

void modem_listener(string func_name, string modem_imei, string modem_index, bool watch_dog = true, string type = "MMCLI") {
	//XXX: Just 1 instance should be running for every modem_imei
	
	MODEM_DAEMON[modem_imei] = true;

	while(GL_MODEM_LISTENER_STATE) {

		if(watch_dog) {
			//keeping this thread running with real time checks
			//XXX: Checks if modem isn't connected
			map<string, vector<string>>::iterator it_modem_finder = MODEM_POOL.find(modem_index);
			if(it_modem_finder == MODEM_POOL.end() or MODEM_POOL[modem_index][0] != modem_imei) {
				printf("%s=> Watch Dogs status --> Modem died: +imei[%s], +index[%s]\n", func_name.c_str(), modem_imei.c_str(), modem_index.c_str());
				MODEM_POOL.erase(it_modem_finder);
				MODEM_DAEMON.erase(MODEM_DAEMON.find(modem_imei));
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

			string tmp_buffer, number, message;
			short int line_counter = 0;
			while(getline(read_job, tmp_buffer)) {
				if(line_counter == 0) number = tmp_buffer;
				else if(line_counter == 1) {
					message = tmp_buffer;
					line_counter = 0;
				}
				++line_counter;
			}

			read_job.close();
			printf("%s=> processing job: number[%s], message[%s]\n", func_name.c_str(), number.c_str(), message.c_str());
			
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
				string sms_command = "ssh root@" + modem_index + " -T -o \"ConnectTimeout=20\" 'sendsms \"" + number + "\" \"" + message + "\"";
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
				string timestamp = helpers::terminal_stdout("date +%s");
				string load_balancer = SYS_FOLDER_MODEM + "/" + modem_imei + "/.load_balancer.dat";
				ofstream write_to_work_load(load_balancer.c_str(), ios::app);
				write_to_work_load << timestamp << ":1" << endl;
				write_to_work_load.close();
			}

		}

		std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
	}

	return;
}

void gl_sms_modem_listener(string func_name) {

	vector<thread::id> modem_listener_container;
	cout << func_name << "=> Began SMS Modem Listener!" << endl;
	while(GL_MODEM_LISTENER_STATE) {
		cout << func_name << "=> Number of Modems about to thread: " << MODEM_POOL.size() << endl;
		for(auto modem : MODEM_POOL) {
			if(!MODEM_DAEMON[modem.second[0]]) {
				printf("%s=> Threading modem listener: +imei[%s], +index[%s]\n", func_name.c_str(), modem.second[0].c_str(), modem.first.c_str());
				string type = modem.first.find(GL_SSH_IP_GATEWAY) != string::npos ? "SSH" : "MMCLI";
				std::thread tr_modem_listener(modem_listener, "Modem Listener", modem.second[0], modem.first, true, type);
				tr_modem_listener.detach();
				modem_listener_container.push_back(tr_modem_listener.get_id());
			}
			printf("%s=> Number of active SMS MODEM LISTENERS = %lu\n", func_name.c_str(), modem_listener_container.size());

		}


		std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
	}
}
