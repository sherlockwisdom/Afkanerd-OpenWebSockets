/* THREAD LISTENING FOR INCOMING REQUEST */

#include "declarations.hpp"


void gl_request_queue_listener(string func_name) {
	//FIXME: Only 1 of this should be running at any moment
	//FIXME: mv SYS_REQUEST_FILE to randomly generated name, then use name to read file
	//ifstream sys_request_file_read(SYS_REQUEST_FILE.c_str());

	while(GL_MODEM_LISTENER_STATE) {
		
		if(!GL_SYSTEM_READY) {
			std::this_thread::sleep_for(std::chrono::seconds(5));
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

			DEQUEUE_JOBS: //XXX: Just a shit on yourself line which I have no clue if it will fire back at me or work properly
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
				for(auto i : tmp_ln_buffer) {
					static bool ignore = false;
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
			}
			sys_request_file_read.close();

			//XXX: File is done reading so we can remove it
			remove(SYS_JOB_FILE.c_str());
			printf("%s=> Work load analysis: #of request[%lu]\n", func_name.c_str(), request_tuple_container.size());
			
			//XXX: Determine the ISP from here
			map<string, vector<map<string, string>>> isp_sorted_request_container;
			for(auto request : request_tuple_container) {
				string number= request["number"];
				string isp = helpers::ISPFinder(number);
				isp_sorted_request_container[isp].push_back(request);
			}
			
			/* 
			 * TODO: Check for connected modems in MODEM_POOL
			 * TODO: then filter modems based on their ISP, 
			 * TODO: then for each filter check the work load
			 * TODO: and distribute files into their system
			 */

			map<string, vector<string>> ISP_container_pnt;
			for(auto i : MODEM_POOL) {
				vector<string> modem_info = i.second;
				ISP_container_pnt[modem_info[1]].push_back(modem_info[0]);
			}

			//XXX: Based on the size of each ISP in ISP_container_pnt, one could determine if to send out the messages or halt them
			//XXX: Remember it's based on the ISP anything else

			printf("%s=> # of ISP Connected [%lu]\n", func_name.c_str(), ISP_container_pnt.size());
			//XXX: Requires functional modems in other to test
			for(auto i : ISP_container_pnt) {
				printf("%s=> For ISP[%s]----\n", func_name.c_str(), i.first.c_str());
				//XXX: Round-Robin algorithm implementation goes here
				vector<map<string,string>> isp_request = isp_sorted_request_container[helpers::to_upper(i.first)];

				//TODO: Thread this!! No need sitting and waiting for one ISP before using the other
				for(int k=0;k<isp_request.size();++k) {
					for(auto j : i.second) {
						if(k<isp_request.size()) {
							printf("%s=> \tJob for modem with info: IMEI: %s\n", func_name.c_str(), j.c_str());
							//XXX: Naming files using UNIX EPOCH counter
							//FIXME: EPOCH is poor choice, because this code runs faster than 1 sec
							string rand_filename = helpers::random_string();
							rand_filename = rand_filename.erase(rand_filename.size() -1, 1);
							rand_filename += ".jb";
							printf("%s=> \tCreating job with filename - %s\n", func_name.c_str(), rand_filename.c_str());
							ofstream job_write((char*)(SYS_FOLDER_MODEMS + "/" + j + "/" + rand_filename).c_str());
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
		}
		std::this_thread::sleep_for(std::chrono::seconds(5));
	}
}
