cd ..\tools
protoc --csharp_out=..\server\lgbf\server  --proto_path=..\proto  ..\proto\message.proto
protoc --plugin=protoc-gen-ts_proto=..\node_modules\.bin\protoc-gen-ts_proto.cmd --ts_proto_out=..\wasteland\assets\script\ServerSDK --proto_path=..\proto ..\proto\message.proto
pause