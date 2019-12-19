#include "helpers.hpp"
#include "declarations.hpp"
#include "gl_request_queue_listener.cxx"


using namespace std;



int main() {
	string test_string2 = "number=652156811,message=\"\nBAH EMMANUEL\n682687508\nBAMENDA RH\nMTB DETECTED\nSat Nov 02 2019\nNot yet recorded as starting TB Rx\nN’est pas enregistrer a commencer le T3 TB\nHelpline 670656041\"";

	auto tuple = parser( test_string2 );

	for( auto i : tuple) 
		cout << i.first << ":" << i.second << endl;
	return 0;
}
