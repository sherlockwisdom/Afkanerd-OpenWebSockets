#include "helpers.hpp"
#include <iostream>
#include <map>
#include <set>

using namespace std;


int main() {
	cout << helpers::split( helpers::terminal_stdout("date +%s"), '\n' )[0] << endl;


	set<pair<int,string>> test_set{
		{1, "one"},
		{1, "one_new"},
		{4, "four"},
		{3, "three"},
		{6, "six"},
		{5, "five"},
		{2, "two"}
	};

	//sort( test_set.begin(), test_set.end());

	for(auto i : test_set) cout << i.first << "-" << i.second << endl;
	return 0;
}
