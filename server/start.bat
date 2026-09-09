cd ./output/dependences/windows/consul/
start consul.exe agent -dev

cd ../redis/
start start.bat

timeout /t 3

cd ../../../bin/windows/
start dbproxy.exe ../../config/dbproxy.cfg
start gate.exe ../../config/gate.cfg

timeout /t 3

cd ../../
start python -m src.login.app ./config/login.cfg
start python -m src.scene.app ./config/scene.cfg

cd ../
pause