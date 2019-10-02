/* THREAD LISTENING FOR INCOMING REQUEST */

#include "declarations.hpp"


auto de_queue_from_request_file() {

	string tmp_ln_buffer;
	ifstream sys_request_file_read(SYS_JOB_FILE.c_str());

	//XXX: Container contains maps which have keys as number and message
	vector<map<string,string>> request_tuple_container;
	/*while(getline(sys_request_file_read, tmp_ln_buffer)) {
		if(tmp_ln_buffer.empty() or tmp_ln_buffer[0] == '#') continue;
		//printf("%s=> request line: [%s]\n", func_name.c_str(), tmp_ln_buffer.c_str());
		//XXX: calculate work load - assumption is simcards in modems won't be changed! So calculations go to modem
		//XXX: custom parser
		//cout << func_name << "=> parsing request...";
		string tmp_string_buffer = "";
		string tmp_key = "";
		map<string, string> request_tuple;
		for(auto i : tmp_ln_buffer) {
			//XXX: checks for seperator
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
			tmp_string_buffer += i;
		}
		if(!tmp_key.empty()) request_tuple.insert(make_pair(tmp_key, tmp_string_buffer));
		//for(auto j : request_tuple) printf("%s=> REQUEST-TUPLE: [%s => %s]\n", func_name.c_str(), j.first.c_str(), j.second.c_str());
		request_tuple_container.push_back(request_tuple);
	}*/
	std::ifstream ifs(SYS_JOB_FILE.c_str());
  	std::string content( (std::istreambuf_iterator<char>(ifs) ),
                       (std::istreambuf_iterator<char>()    ) );
	string tmp_key = "";
	string tmp_string_buffer = "";
	bool ignore = false;
	for(auto i : content) {
		//XXX: checks for seperator
		if(i == '=' and !ignore) {
			tmp_key = tmp_string_buffer;
			tmp_string_buffer = "";
			continue;
		}
		if(i == ',' and !ignore) {
			map<string,string>request_tuple{{tmp_key, tmp_string_buffer}};
			tmp_key = "";
			tmp_string_buffer = "";
			request_tuple_container.push_back(request_tuple);
			continue;
		}
		if(i == '"') {
			ignore = !ignore;
			continue;
		}
		tmp_string_buffer += i;
	}
	sys_request_file_read.close();
	return request_tuple_container;
}


auto determine_isp_for_request(vector<map<string,string>> request_tuple_container) {
	map<string,vector<map<string,string>>> isp_sorted_request_container;
	for(auto request : request_tuple_container) {
		string number= request["number"];
		string isp = helpers::ISPFinder(number);
		isp_sorted_request_container[isp].push_back(request);
	}

	return isp_sorted_request_container;
}


void isp_distribution(string func_name, string isp, vector<map<string, string>> isp_request) {
	for(int k=0;k<isp_request.size();++k) {
		if(MODEM_DAEMON.empty()) {
			cout << func_name << "=> No modem found, writing back to request file..." << endl;
			ofstream write_back_to_request_file(SYS_REQUEST_FILE, ios::app);
			write_back_to_request_file << "number=" << isp_request[k]["number"] << ",message=\"" << isp_request[k]["message"] << "\"" << endl;
			write_back_to_request_file.close();
			break;
		}
		for(auto modem : MODEM_DAEMON) {
			if(helpers::to_upper(modem.second) != isp) continue;

			if(!helpers::modem_is_available(modem.first)) continue;
			if(k<isp_request.size()) {
				printf("%s=> \tJob for modem with info: IMEI: %s\n", func_name.c_str(), modem.first.c_str());
				//XXX: Naming files using UNIX EPOCH counter
				//FIXME: EPOCH is poor choice, because this code runs faster than 1 sec
				string rand_filename = helpers::random_string();
				rand_filename = rand_filename.erase(rand_filename.size() -1, 1);
				rand_filename += ".jb";
				printf("%s=> \tCreating job with filename - %s\n", func_name.c_str(), rand_filename.c_str());
				ofstream job_write((char*)(SYS_FOLDER_MODEMS + "/" + modem.first + "/" + rand_filename).c_str());
				//FIXME: verify file is opened
				map<string, string> request = isp_request[k];
				job_write << request["number"] << "\n" << request["message"];
				job_write.close();
				++k;
			}
			else {
				break;
			}
		}
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

		/*if(!sys_request_file_read) {
			cout << func_name << "=> no request file, thus no request yet..." << endl;
		}*/
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
