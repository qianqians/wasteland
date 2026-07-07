cd ../../tools

protoc --csharp_out=../lgbf/hub  --proto_path=../lgbf/underlying  ../lgbf/underlying/underlying.proto
protoc --csharp_out=../gem/unity/Assets/Script/ServerSDK  --proto_path=../lgbf/underlying  ../lgbf/underlying/underlying.proto

protoc --plugin=../../node_modules/.bin/protoc-gen-ts_proto \
    --ts_proto_out=../gem/ccc/assets/script/ServerSDK \
    --proto_path=../lgbf/underlying  ../lgbf/underlying/underlying.proto