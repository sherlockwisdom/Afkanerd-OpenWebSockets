#ifndef HELPERS_H_INCLUDED_
#define HELPERS_H_INCLUDED_
using namespace std;

namespace helpers {
string terminal_stdout(string command) {
  	string data;
  	FILE * stream;
  	const int max_buffer = 1024;
  	char buffer[max_buffer];
  	command.append(" 2>&1");

  	stream = popen(command.c_str(), "r");
  	if (stream) {
  		while (!feof(stream)) if (fgets(buffer, max_buffer, stream) != NULL) data.append(buffer);
  		pclose(stream);
  	}
  	return data;
}

vector<string> split(string _string, char del = ' ', bool strict = false) {
	vector<string> return_value;
	string temp_string = "";
	for(auto _char : _string) {
		if(_char==del) {
			if(strict and temp_string.empty()) continue;
			return_value.push_back(temp_string);
			temp_string="";
		}
		else {
			temp_string+=_char;
		}
	}
	if(strict and !temp_string.empty()) return_value.push_back(temp_string);

	return return_value;
}

}

#endif
