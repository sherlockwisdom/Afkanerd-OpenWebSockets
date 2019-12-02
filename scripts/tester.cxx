#include "declarations.hpp"
#include "helpers.hpp"
#include "gl_request_queue_listener.cxx"


using namespace std;



int main() {
	curl_server( GL_TCP_HOST, GL_TCP_PORT, GL_TCP_URL, "Daemon Tester" );
	return 0;
}
