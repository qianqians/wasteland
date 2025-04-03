cd ./rpc

python genc2h.py python ../proto/client_call_hub ../proto/common "" ../../server/src/engine
python genc2h.py ts ../proto/client_call_hub ../proto/common ../../wasteland/assets/script/serverSDK/engine

python genh2c.py python ../proto/hub_call_client ../proto/common "" ../../server/src/engine
python genh2c.py ts ../proto/hub_call_client ../proto/common ../../wasteland/assets/script/serverSDK/engine

python genh2h.py python ../proto/hub_call_hub ../proto/common ../../server/src/engine

cd ../proto

pause