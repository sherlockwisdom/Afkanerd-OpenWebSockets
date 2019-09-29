#ifndef HELPERS_H_INCLUDED_
#define HELPERS_H_INCLUDED_
#include <algorithm>
#include <random>
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


string ISPFinder(string number) {
	if(number[0] == '6') {
		switch(number[1]) {
			case '5':
				switch(number[2]) {
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
						return "MTN";
					break;

					case '5':
					case '6':
					case '7':
					case '8':
					case '9':
						return "ORANGE";
					break;

				}
			break;

			case '7': return "MTN";
			break;

			case '8':
				  switch(number[2]) {
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
						return "MTN";
					break;

					case '5':
					case '6':
					case '7':
					case '8':
					case '9':
						return "NEXTEL";
					break;
				  }
			break;

			case '9': return "ORANGE";
			break;
		}
	}
	return "";
						
}

string random_string()
{
     string str("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

     random_device rd;
     mt19937 generator(rd());

     shuffle(str.begin(), str.end(), generator);

     return str.substr(0, 32);    // assumes 32 < number of characters in str         
}

string to_upper(string input) {
	string str = input;
	transform(str.begin(), str.end(),str.begin(), ::toupper);
	return str;
}



bool modem_is_available(string modem_imei) {
	string list_of_modem_indexes = helpers::terminal_stdout("./modem_information_extraction.sh list");
	vector<string> modem_indexes = helpers::split(list_of_modem_indexes, '\n', true);

	for(auto modem_index : modem_indexes) {
		string imei = helpers::split( helpers::terminal_stdout((string)("./modem_information_extraction.sh extract " + modem_index)), ':', true)[0];
		if(imei == modem_imei) return true;
	}
	return false;
}


}

#endif
