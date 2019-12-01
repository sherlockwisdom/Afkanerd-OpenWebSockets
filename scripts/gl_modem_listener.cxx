#include "helpers.hpp"

using namespace std;





void modem_cleanse( string imei ) {
	map<string,string>::iterator it_modem_daemon = MODEM_DAEMON.find(imei);
	if(it_modem_daemon != MODEM_DAEMON.end()) 
		MODEM_DAEMON.erase( it_modem_daemon );
}


vector<string> get_modems_jobs(string folder_name) {
	return helpers::split( helpers::terminal_stdout((string)("ls -1 " + folder_name)), '\n', true );
}

map<string, string> read_request_file( string full_filename, string modem_imei) {
	string func_name = "read_request_file";
	printf("%s=> EXECUTING JOB FOR FILE: %s\n", func_name.c_str(), full_filename.c_str());
	ifstream read_job(full_filename.c_str());
	if(!read_job) {
		cerr << func_name << "=> error reading job: " << full_filename << endl;
		return (map<string,string>){};
	}

	string tmp_buffer, number, message = "";
	short int line_counter = 0;

	//Why is this doing this here??????
	//I see... some messages have \n characters in them... this part is to make sure they maintain that integrity
	while(getline(read_job, tmp_buffer)) {
		if(line_counter == 0) number = tmp_buffer;
		else if(line_counter > 0) {
			message += "\n" + tmp_buffer;
			line_counter = 0;
		}
		++line_counter;
	}
	read_job.close();

	return (map<string,string>){{"message", message}, {"number", number}};
}



bool mmcli_send( string message, string number, string modem_index ) {
	string func_name = "mmcli_send";
	string sms_command = "./modem_information_extraction.sh sms send \"" + message + "\" " + number + " " + modem_index;
	string terminal_stdout = helpers::terminal_stdout(sms_command);
	cout << func_name << "=> sending sms message...\n" << func_name << "=> \t\tStatus " << terminal_stdout << endl << endl;
	if(terminal_stdout.find("success") == string::npos or terminal_stdout.find("Success") == string::npos) {
		if(terminal_stdout.find("timed out") != string::npos) {
			printf("%s=> Modem needs to sleep... going down for 60 seconds\n", func_name.c_str());
			std::this_thread::sleep_for(std::chrono::seconds(GL_MMCLI_MODEM_SLEEP_TIME));
		}
		return false;
	}

	return true;
}


void write_for_urgent_transmission( string modem_imei, string message, string number ) {
	//XXX: which modem has been the most successful
	string func_name = "write_for_urgent_transmission";
	if( !GL_SUCCESS_MODEM_LIST.empty() ) {
		string most_successful_modem;
		auto it_GL_SUCCESS_MODEM_LIST = GL_SUCCESS_MODEM_LIST.begin();
		int most_successful_modem_count = it_GL_SUCCESS_MODEM_LIST->second;
		++it_GL_SUCCESS_MODEM_LIST;

		//FIXME: Something's wrong with this iterator
		for( auto it_GL_SUCCESS_MODEM_LIST : GL_SUCCESS_MODEM_LIST ) {
			if( it_GL_SUCCESS_MODEM_LIST.first != modem_imei and it_GL_SUCCESS_MODEM_LIST.second > most_successful_modem_count ) {
				most_successful_modem_count = it_GL_SUCCESS_MODEM_LIST.second;
				most_successful_modem = it_GL_SUCCESS_MODEM_LIST.first;
			}
		}
		printf("%s=> Most successful modem | %s | count | %d\n", func_name.c_str(), most_successful_modem.c_str(), most_successful_modem_count);

		string modem_index;
		for(auto modem_details : MODEM_POOL) {
			if( modem_details.second[0] == most_successful_modem ) {
				modem_index = modem_details.first;
				break;
			}
		}

		//FIXME: This solution is not checking for SSH modems
		if( modem_index.empty() ) {
			//FIXME: Should check for another modem rather than send things back to the request file
			helpers::write_to_request_file( message, number );
		}
		else {
			mmcli_send( message, number, modem_index );
		}
	}
}

bool ssh_send( string message, string number, string modem_ip ) {
	//TODO: Figure out how to make SSH tell if SMS has gone out or failed
	string func_name = "ssh_send";
	string sms_command = "ssh root@" + modem_ip + " -T -o \"ConnectTimeout=20\" \"sendsms '" + number + "' \\\"" + message + "\\\"\"";
	string terminal_stdout = helpers::terminal_stdout(sms_command);
	cout << func_name << "=> sending sms message...\n" << func_name << "=> \t\tStatus " << terminal_stdout << endl << endl;

	return true; //FIXME: This is propaganda
}

void update_modem_success_count( string modem_imei ) {
	//TODO: increment success count for this modem
	if( GL_SUCCESS_MODEM_LIST.find( modem_imei ) == GL_SUCCESS_MODEM_LIST.end() ) {
		GL_SUCCESS_MODEM_LIST.insert( make_pair( modem_imei, 0 ) );
	}

	GL_SUCCESS_MODEM_LIST[modem_imei] += 1;
}


void modem_listener(string func_name, string modem_imei, string modem_index, string ISP, bool watch_dog = true, string type = "MMCLI") {
	//XXX: Just 1 instance should be running for every modem_imei
	printf("%s=> Started instance of modem=> \n+imei[%s] +index[%s] +isp[%s] +type[%s]\n\n", func_name.c_str(), modem_imei.c_str(), modem_index.c_str(), ISP.c_str(), type.c_str());

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
			map<string,string> request_file_content = read_request_file( full_filename, modem_imei );

			if( request_file_content.empty() ) {
				fprintf(stderr, "%s=> Nothing returned from file....", func_name.c_str() );
				continue;
			}
			if( request_file_content["message"].empty() ) {
				fprintf( stderr, "%s=> Found bad file --- no message--- deleting....", func_name.c_str());
				if( remove(full_filename.c_str()) != 0 ) {
					cerr << func_name << "=> failed to delete job!!!!!" << endl;
					char str_error[256];
					cerr << func_name << "=> errno message: " << strerror_r(errno, str_error, 256) << endl;
				}
				continue;
			}
			if( request_file_content["number"].empty() ) {
				fprintf( stderr, "%s=> Found bad file --- no number--- deleting....", func_name.c_str());
				if( remove(full_filename.c_str()) != 0 ) {
					cerr << func_name << "=> failed to delete job!!!!!" << endl;
					char str_error[256];
					cerr << func_name << "=> errno message: " << strerror_r(errno, str_error, 256) << endl;
				}
				continue;
			}

			string message = request_file_content["message"];
			string number = request_file_content["number"];

			//printf("%s=> processing job: number[%s], message[%s]\n", func_name.c_str(), number.c_str(), message.c_str());
			if(type == "MMCLI") {
				mmcli_send( message, number, modem_index ) ? update_modem_success_count( modem_imei ) : write_for_urgent_transmission( modem_imei, message, number );
			}

			else if(type == "SSH") {
				ssh_send( message, number, modem_index ) ? update_modem_success_count( modem_imei ) : write_for_urgent_transmission( modem_imei, message, number );
			}

			//XXX: Test if it fails to delete this file
			if( remove(full_filename.c_str()) != 0 ) {
				cerr << func_name << "=> failed to delete job!!!!!" << endl;
				char str_error[256];
				cerr << func_name << "=> errno message: " << strerror_r(errno, str_error, 256) << endl;
			}
		}

		std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
	}

	return;
}


void ssh_extractor( string ip_gateway ) {
	string func_name = "configure_ssh_modems";

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
			if(MODEM_DAEMON.find(ip_gateway) != MODEM_DAEMON.end()) {
				cout << func_name << "=> instance of SSH already running... watch dog reset!" << endl;
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
