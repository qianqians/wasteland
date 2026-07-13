protoc --csharp_out=../hub  --proto_path=../underlying  ../underlying/underlying.proto
protoc --csharp_out=../../gem/unity/Assets/Script/ServerSDK  --proto_path=../underlying  ../underlying/underlying.proto

protoc --plugin=../../node_modules/.bin/protoc-gen-ts_proto \
    --ts_proto_out=../../gem/ccc/assets/script/ServerSDK \
    --proto_path=../underlying  ../underlying/underlying.proto