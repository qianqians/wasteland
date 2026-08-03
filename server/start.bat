cd ./dependences/windows/consul/
start consul.exe agent -dev

cd ../redis/
start start.bat

timeout /t 3

cd ../../../bin/windows/
start dbproxy.exe ../../config/dbproxy.cfg
start gate.exe ../../config/gate.cfg

timeout /t 3

cd ../
pause