/* THREAD LISTENING FOR INCOMING REQUEST */

#include "declarations.hpp"

void gl_request_queue_listener(string func_name) {
	//FIXME: Only 1 of this should be running at any moment
	//FIXME: mv SYS_REQUEST_FILE to randomly generated name, then use name to read file
	//ifstream sys_request_file_read(SYS_REQUEST_FILE.c_str());

	while(GL_MODEM_LISTENER_STATE) {
		//FIXME: This line is just for testing purposes; should not be kept because it will create an endless loop
		//
		/*
		if(MODEM_POOL.empty()) {
			std::this_thread::sleep_for(std::chrono::seconds(5));
			continue;
		}
		*/

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
				cout << "DONE!" << endl;
				//for(auto j : request_tuple) printf("%s=> REQUEST-TUPLE: [%s => %s]\n", func_name.c_str(), j.first.c_str(), j.second.c_str());
				request_tuple_container.push_back(request_tuple);
			}
			printf("%s=> Work load analysis: #of request[%lu]\n", func_name.c_str(), request_tuple_container.size());
			
			//XXX: Determine the ISP from here
			map<string, map<string, string>> isp_sorted_request_container;
			for(auto request : request_tuple_container) {
				string number= request["number"];
				string isp = helpers::ISPFinder(number);
				isp_sorted_request_container[isp] = request;
			}
			
			/* 
			 * Check for connected modems in MODEM_POOL
			 * then filter modems based on their ISP, 
			 * then for each filter check the work load
			 * and distribute files into their system
			 */

			map<string, vector<string>> ISP_container_pnt;
			for(auto i : MODEM_POOL) {
				vector<string> modem_info = i.second;
				ISP_container_pnt[modem_info[1]].push_back(modem_info[0]);
			}

			printf("%s=> # of ISP Connected [%lu]\n", func_name.c_str(), ISP_container_pnt.size());
			//XXX: Requires functional modems in other to test
			for(auto i : ISP_container_pnt) {
				printf("%s=> For ISP[%s]----\n", func_name.c_str(), i.first.c_str());
				long unsigned int number_of_modems_for_isp = i.second.size();
				long unsigned int number_of_request_for_isp = isp_sorted_request_container[i.first].size();
				//therefore by round-robin algorithm, everyone get's equal
				float request_per_modem = number_of_request_for_isp / number_of_modems_for_isp;
				printf("%s=> Request per Modem = %f", func_name.c_str(), request_per_modem);
				for(auto j : i.second) {
					printf("%s=> \tIMEI: %s\n", func_name.c_str(), j.c_str());
					//checking workload - some badass algorith is needed here
					//FIXME: so not to slow down, would just implement a round-robin here and return to it

					
				}

			}	
		}


		//cout << func_name << "=> sleeping thread..." << flush;
		std::this_thread::sleep_for(std::chrono::seconds(5));
		//cout << " [done]" << endl;

		//FIXME: This is just for testing purposes... if left nothing will be kept in queue
		sys_request_file_read.close();
	}
	//sys_request_file_read.close();
}
