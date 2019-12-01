/* THREAD LISTENING FOR INCOMING REQUEST */

#include "declarations.hpp"


vector<map<string,string>> de_queue_from_request_file() {

	string tmp_ln_buffer;
	ifstream sys_request_file_read(SYS_JOB_FILE.c_str());

	//XXX: Container contains maps which have keys as number and message
	vector<map<string,string>> request_tuple_container;
	while(getline(sys_request_file_read, tmp_ln_buffer)) {
		if(tmp_ln_buffer.empty() or tmp_ln_buffer[0] == '#') continue;
		//printf("%s=> request line: [%s]\n", func_name.c_str(), tmp_ln_buffer.c_str());
		//XXX: calculate work load - assumption is simcards in modems won't be changed! So calculations go to modem
		//XXX: custom parser
		//cout << func_name << "=> parsing request...";
		string tmp_string_buffer = "";
		string tmp_key = "";
		map<string, string> request_tuple;
		bool ignore = false;
		bool safe = false;
		for(auto i : tmp_ln_buffer) {
			//XXX: checks for seperator
			if(i == 'n' and safe and ignore) {
				tmp_string_buffer += '\n';
				safe = false;
				continue;
			}
			if(i == '=' and !ignore) {
				tmp_key = tmp_string_buffer;
				tmp_string_buffer = "";
				continue;
			}
			if(i == ',' and !ignore) {
				request_tuple.insert(make_pair(tmp_key, tmp_string_buffer));
				tmp_key = "";
				tmp_string_buffer = "";
				continue;
			}
			if(i == '"') {
				ignore = !ignore;
				continue;
			}
			if(i == '\\' and ignore) {
				safe = true;
				continue;
			}
			tmp_string_buffer += i;
		}
		if(!tmp_key.empty()) request_tuple.insert(make_pair(tmp_key, tmp_string_buffer));
		//for(auto j : request_tuple) printf("%s=> REQUEST-TUPLE: [%s => %s]\n", "PARSED REQUEST", j.first.c_str(), j.second.c_str());
		request_tuple_container.push_back(request_tuple);
	}
	sys_request_file_read.close();
	return request_tuple_container;
}


auto determine_isp_for_request(vector<map<string,string>> request_tuple_container) {
	map<string,vector<map<string,string>>> isp_sorted_request_container; //ISP=>container of messages
	for(int i=0;i<request_tuple_container.size();++i) {
		map<string, string> request = request_tuple_container[i];
		string number= request["number"];
		string isp = helpers::ISPFinder(number);
		if(!isp.empty()) {
			isp_sorted_request_container[isp].push_back(request);
		}
		else {
			string message = request["message"];
			string number = request["number"];
			helpers::write_to_request_file( message, number );
		}
	}

	return isp_sorted_request_container;
}


void write_modem_job_file( string modem_imei, string message, string number ) {
	string func_name = "write_modem_job_file";
	printf("%s=> \tJob for modem with info: IMEI: %s\n", func_name.c_str(), modem_imei.c_str());

	string rand_filename = helpers::random_string();
	rand_filename = rand_filename.erase(rand_filename.size() -1, 1);
	rand_filename += ".jb";

	printf("%s=> \tCreating job with filename - %s\n", func_name.c_str(), rand_filename.c_str());
	ofstream job_write((char*)(SYS_FOLDER_MODEMS + "/" + modem_imei + "/" + rand_filename).c_str());
	job_write << number << "\n" << message;
	job_write.close();
}

void isp_distribution(string func_name, string isp, vector<map<string, string>> isp_request) {
	if(MODEM_DAEMON.empty()) {
		cout << func_name << "=> No modem found, writing back to request file..." << endl;
		for(auto request_container : isp_request) {
			string message = request_container["message"];
			string number = request_container["number"];
			helpers::write_to_request_file( message, number );
		}
		return;
	}

	//TODO: determine all modems for this ISP then send out the messages, will help with even distribution
	map<string,string> isp_modems;
	cout << func_name << "=> checking for modems for this ISP" << endl;
	for( auto modem : MODEM_DAEMON ) {
		if( modem.second.find( isp ) != string::npos ) {
			isp_modems.insert( modem ); //FIXME: I doubt this
		}
	}

	cout << func_name << "=> number of modems for ISP| {" << isp_modems.size() << "}" << endl;
	if( isp_modems.size() < 1 ) {
		cout << func_name << "=> No modem found for ISP, writing back to request file and going to sleep " <<endl;
		//std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
		std::this_thread::sleep_for(std::chrono::seconds(10));

		for(auto request_container : isp_request) {
			string message = request_container["message"];
			string number = request_container["number"];
			helpers::write_to_request_file( message, number );
		}
		return;
	}

	size_t request_index = 0;
	for( map<string,string>::iterator i = isp_modems.begin();i != isp_modems.end();++i ) {
		string modem_imei = i->first;
		string modem_isp = i->second;

		if( request_index >= isp_request.size() ) break;

		if(!helpers::modem_is_available(modem_imei)) {
			printf("%s=> Not available modem: ISP for +imei[%s] +ISP[%s]\n", func_name.c_str(), modem_imei.c_str(), modem_isp.c_str());
			continue;
		}

		map<string, string> request = isp_request[request_index];
		++request_index;

		string message = request["message"];
		string number = request["number"];
		
		write_modem_job_file( modem_imei, message, number );

		if( ++i; i== isp_modems.end()) i = isp_modems.begin();
		else --i;
	}
}


void gl_request_queue_listener(string func_name) {
	//FIXME: Only 1 of this should be running at any moment
	//FIXME: mv SYS_REQUEST_FILE to randomly generated name, then use name to read file
	//ifstream sys_request_file_read(SYS_REQUEST_FILE.c_str());

	while(GL_MODEM_LISTENER_STATE) {
		
		if(!GL_SYSTEM_READY) {
			std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
			continue;
		}

		if( struct stat buffer;(stat (SYS_JOB_FILE.c_str(), &buffer) == 0) ) {
			cout << func_name << "=> WARNING: OLD JOBS PRESENT IN SYSTEM... JUMPING CHECKS AND DEQUEING!!!" << endl;
			goto DEQUEUE_JOBS;
		}

		if( struct stat buffer;!(stat (SYS_REQUEST_FILE.c_str(), &buffer) == 0) ) 
			cout << func_name << "=> no request file, thus no request yet..." << endl;

		else {
			//FIXME: Add some errno catch here, to make sure this happens well
			rename(SYS_REQUEST_FILE.c_str(), SYS_JOB_FILE.c_str());
			//cout << func_name <<"=> renamed request file..." << endl;

			//goto statement here because sometimes shit has to continue from where it stopped
			DEQUEUE_JOBS: 
			vector<map<string,string>> request_tuple_container = de_queue_from_request_file();

			//File is done reading so we can remove it
			remove(SYS_JOB_FILE.c_str());
			
			//Determine the ISP from here
			map<string, vector<map<string, string>>> isp_sorted_request_container = determine_isp_for_request(request_tuple_container);
			
			/* 
			 * Check for connected modems in MODEM_POOL
			 * Then filter modems based on their ISP, 
			 * Then for each filter check the work load
			 * Distribute files into their system
			 */
			/*
			map<string, vector<string>> ISP_container_pnt;
			for(auto i : MODEM_DAEMON) {
				ISP_container_pnt[i.first].push_back(i.second);
			}*/

			//XXX: Based on the size of each ISP in ISP_container_pnt, one could determine if to send out the messages or halt them
			//XXX: Remember it's based on the ISP anything else

			//printf("%s=> # of ISP Connected [%lu]\n", func_name.c_str(), ISP_container_pnt.size());
			//XXX: Requires functional modems in other to test
			for(auto i : isp_sorted_request_container) {
				printf("%s=> For ISP[%s]----\n", func_name.c_str(), i.first.c_str());

				//TODO: Thread this!! No need sitting and waiting for one ISP before using the other
				std::thread tr_isp_distribution(isp_distribution, "ISP Distribution", i.first, i.second);
				tr_isp_distribution.detach();
			}	
		}
		std::this_thread::sleep_for(std::chrono::seconds(GL_TR_SLEEP_TIME));
	}
}
