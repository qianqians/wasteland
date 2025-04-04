/// <reference types="node" />

import { EventEmitter } from "events";

// Thrift re-exports node-int64 and Q
import Int64 = require("./Int64.js");
export { Int64 as Int64 };

export interface TMap {
    ktype: Thrift.Type;
    vtype: Thrift.Type;
    size: number;
}

export interface TMessage {
    fname: string;
    mtype: Thrift.MessageType;
    rseqid: number;
}

export interface TField {
    fname: string;
    ftype: Thrift.Type;
    fid: number;
}

export interface TList {
    etype: Thrift.Type;
    size: number;
}

export interface TSet {
    etype: Thrift.Type;
    size: number;
}

export interface TStruct {
    fname: string;
}

export interface TStructLike {
    read(input: TProtocol): void;
    write(output: TProtocol): void;
}

export interface TTransport {
    commitPosition(): void;
    rollbackPosition(): void;
    isOpen(): boolean;
    open(): boolean;
    close(): boolean;
    setCurrSeqId(seqId: number): void;
    ensureAvailable(len: number): void;
    read(len: number): Buffer;
    readByte(): number;
    readI16(): number;
    readI32(): number;
    readDouble(): number;
    readString(): string;
    write(buf: Buffer | string): void;
    flush(): void;
}

export interface TProtocol {
    flush(): void;
    writeMessageBegin(name: string, type: Thrift.MessageType, seqid: number): void;
    writeMessageEnd(): void;
    writeStructBegin(name: string): void;
    writeStructEnd(): void;
    writeFieldBegin(name: string, type: Thrift.Type, id: number): void;
    writeFieldEnd(): void;
    writeFieldStop(): void;
    writeMapBegin(ktype: Thrift.Type, vtype: Thrift.Type, size: number): void;
    writeMapEnd(): void;
    writeListBegin(etype: Thrift.Type, size: number): void;
    writeListEnd(): void;
    writeSetBegin(etype: Thrift.Type, size: number): void;
    writeSetEnd(): void;
    writeBool(bool: boolean): void;
    writeByte(b: number): void;
    writeI16(i16: number): void;
    writeI32(i32: number): void;
    writeI64(i64: number | Int64): void;
    writeDouble(dbl: number): void;
    writeString(arg: string | Buffer): void;
    writeBinary(arg: string | Buffer): void;
    readMessageBegin(): TMessage;
    readMessageEnd(): void;
    readStructBegin(): TStruct;
    readStructEnd(): void;
    readFieldBegin(): TField;
    readFieldEnd(): void;
    readMapBegin(): TMap;
    readMapEnd(): void;
    readListBegin(): TList;
    readListEnd(): void;
    readSetBegin(): TSet;
    readSetEnd(): void;
    readBool(): boolean;
    readByte(): number;
    readI16(): number;
    readI32(): number;
    readI64(): Int64;
    readDouble(): number;
    readBinary(): Buffer;
    readString(): string;
    getTransport(): TTransport;
    skip(type: Thrift.Type): void;
}

export interface HttpHeaders {
    [name: string]: number | string | string[] | undefined;
}

export interface SeqId2Service {
    [seqid: number]: string;
}

export type TTransportCallback = (msg?: Buffer, seqid?: number) => void;

// eslint-disable-next-line @definitelytyped/no-unnecessary-generics

export class TBufferedTransport implements TTransport {
    constructor(buffer?: Buffer, callback?: TTransportCallback);
    static receiver(
        callback: (trans: TBufferedTransport, seqid: number) => void,
        seqid: number,
    ): (data: Buffer) => void;
    commitPosition(): void;
    rollbackPosition(): void;
    isOpen(): boolean;
    open(): boolean;
    close(): boolean;
    setCurrSeqId(seqId: number): void;
    ensureAvailable(len: number): void;
    read(len: number): Buffer;
    readByte(): number;
    readI16(): number;
    readI32(): number;
    readDouble(): number;
    readString(): string;
    write(buf: Buffer | string): void;
    flush(): void;
}

export class TFramedTransport implements TTransport {
    constructor(buffer?: Buffer, callback?: TTransportCallback);
    static receiver(callback: (trans: TFramedTransport, seqid: number) => void, seqid: number): (data: Buffer) => void;
    commitPosition(): void;
    rollbackPosition(): void;
    isOpen(): boolean;
    open(): boolean;
    close(): boolean;
    setCurrSeqId(seqId: number): void;
    ensureAvailable(len: number): void;
    read(len: number): Buffer;
    readByte(): number;
    readI16(): number;
    readI32(): number;
    readDouble(): number;
    readString(): string;
    write(buf: Buffer | string): void;
    flush(): void;
}

export interface TTransportConstructor {
    new(buffer?: Buffer, callback?: TTransportCallback): TTransport;
}

export class TBinaryProtocol implements TProtocol {
    constructor(trans: TTransport, strictRead?: boolean, strictWrite?: boolean);
    flush(): void;
    writeMessageBegin(name: string, type: Thrift.MessageType, seqid: number): void;
    writeMessageEnd(): void;
    writeStructBegin(name: string): void;
    writeStructEnd(): void;
    writeFieldBegin(name: string, type: Thrift.Type, id: number): void;
    writeFieldEnd(): void;
    writeFieldStop(): void;
    writeMapBegin(ktype: Thrift.Type, vtype: Thrift.Type, size: number): void;
    writeMapEnd(): void;
    writeListBegin(etype: Thrift.Type, size: number): void;
    writeListEnd(): void;
    writeSetBegin(etype: Thrift.Type, size: number): void;
    writeSetEnd(): void;
    writeBool(bool: boolean): void;
    writeByte(b: number): void;
    writeI16(i16: number): void;
    writeI32(i32: number): void;
    writeI64(i64: number | Int64): void;
    writeDouble(dbl: number): void;
    writeString(arg: string | Buffer): void;
    writeBinary(arg: string | Buffer): void;
    readMessageBegin(): TMessage;
    readMessageEnd(): void;
    readStructBegin(): TStruct;
    readStructEnd(): void;
    readFieldBegin(): TField;
    readFieldEnd(): void;
    readMapBegin(): TMap;
    readMapEnd(): void;
    readListBegin(): TList;
    readListEnd(): void;
    readSetBegin(): TSet;
    readSetEnd(): void;
    readBool(): boolean;
    readByte(): number;
    readI16(): number;
    readI32(): number;
    readI64(): Int64;
    readDouble(): number;
    readBinary(): Buffer;
    readString(): string;
    getTransport(): TTransport;
    skip(type: Thrift.Type): void;
}

export class TJSONProtocol implements TProtocol {
    constructor(trans: TTransport);
    flush(): void;
    writeMessageBegin(name: string, type: Thrift.MessageType, seqid: number): void;
    writeMessageEnd(): void;
    writeStructBegin(name: string): void;
    writeStructEnd(): void;
    writeFieldBegin(name: string, type: Thrift.Type, id: number): void;
    writeFieldEnd(): void;
    writeFieldStop(): void;
    writeMapBegin(ktype: Thrift.Type, vtype: Thrift.Type, size: number): void;
    writeMapEnd(): void;
    writeListBegin(etype: Thrift.Type, size: number): void;
    writeListEnd(): void;
    writeSetBegin(etype: Thrift.Type, size: number): void;
    writeSetEnd(): void;
    writeBool(bool: boolean): void;
    writeByte(b: number): void;
    writeI16(i16: number): void;
    writeI32(i32: number): void;
    writeI64(i64: number | Int64): void;
    writeDouble(dbl: number): void;
    writeString(arg: string | Buffer): void;
    writeBinary(arg: string | Buffer): void;
    readMessageBegin(): TMessage;
    readMessageEnd(): void;
    readStructBegin(): TStruct;
    readStructEnd(): void;
    readFieldBegin(): TField;
    readFieldEnd(): void;
    readMapBegin(): TMap;
    readMapEnd(): void;
    readListBegin(): TList;
    readListEnd(): void;
    readSetBegin(): TSet;
    readSetEnd(): void;
    readBool(): boolean;
    readByte(): number;
    readI16(): number;
    readI32(): number;
    readI64(): Int64;
    readDouble(): number;
    readBinary(): Buffer;
    readString(): string;
    getTransport(): TTransport;
    skip(type: Thrift.Type): void;
}

export class TCompactProtocol implements TProtocol {
    constructor(trans: TTransport);
    flush(): void;
    writeMessageBegin(name: string, type: Thrift.MessageType, seqid: number): void;
    writeMessageEnd(): void;
    writeStructBegin(name: string): void;
    writeStructEnd(): void;
    writeFieldBegin(name: string, type: Thrift.Type, id: number): void;
    writeFieldEnd(): void;
    writeFieldStop(): void;
    writeMapBegin(ktype: Thrift.Type, vtype: Thrift.Type, size: number): void;
    writeMapEnd(): void;
    writeListBegin(etype: Thrift.Type, size: number): void;
    writeListEnd(): void;
    writeSetBegin(etype: Thrift.Type, size: number): void;
    writeSetEnd(): void;
    writeBool(bool: boolean): void;
    writeByte(b: number): void;
    writeI16(i16: number): void;
    writeI32(i32: number): void;
    writeI64(i64: number | Int64): void;
    writeDouble(dbl: number): void;
    writeString(arg: string | Buffer): void;
    writeBinary(arg: string | Buffer): void;
    readMessageBegin(): TMessage;
    readMessageEnd(): void;
    readStructBegin(): TStruct;
    readStructEnd(): void;
    readFieldBegin(): TField;
    readFieldEnd(): void;
    readMapBegin(): TMap;
    readMapEnd(): void;
    readListBegin(): TList;
    readListEnd(): void;
    readSetBegin(): TSet;
    readSetEnd(): void;
    readBool(): boolean;
    readByte(): number;
    readI16(): number;
    readI32(): number;
    readI64(): Int64;
    readDouble(): number;
    readBinary(): Buffer;
    readString(): string;
    getTransport(): TTransport;
    skip(type: Thrift.Type): void;
}

export interface TProtocolConstructor {
    new(trans: TTransport, strictRead?: boolean, strictWrite?: boolean): TProtocol;
}

// thrift.js
export namespace Thrift {
    enum Type {
        STOP = 0,
        VOID = 1,
        BOOL = 2,
        BYTE = 3,
        I08 = 3,
        DOUBLE = 4,
        I16 = 6,
        I32 = 8,
        I64 = 10,
        STRING = 11,
        UTF7 = 11,
        STRUCT = 12,
        MAP = 13,
        SET = 14,
        LIST = 15,
        UTF8 = 16,
        UTF16 = 17,
    }

    enum MessageType {
        CALL = 1,
        REPLY = 2,
        EXCEPTION = 3,
        ONEWAY = 4,
    }

    class TException extends Error {
        name: string;
        message: string;

        constructor(message: string);

        getMessage(): string;
    }

    enum TApplicationExceptionType {
        UNKNOWN = 0,
        UNKNOWN_METHOD = 1,
        INVALID_MESSAGE_TYPE = 2,
        WRONG_METHOD_NAME = 3,
        BAD_SEQUENCE_ID = 4,
        MISSING_RESULT = 5,
        INTERNAL_ERROR = 6,
        PROTOCOL_ERROR = 7,
        INVALID_TRANSFORM = 8,
        INVALID_PROTOCOL = 9,
        UNSUPPORTED_CLIENT_TYPE = 10,
    }

    class TApplicationException extends TException {
        message: string;
        code: number;

        constructor(type?: TApplicationExceptionType, message?: string);
        read(input: TProtocol): void;
        write(output: TProtocol): void;
        getCode(): number;
    }

    enum TProtocolExceptionType {
        UNKNOWN = 0,
        INVALID_DATA = 1,
        NEGATIVE_SIZE = 2,
        SIZE_LIMIT = 3,
        BAD_VERSION = 4,
        NOT_IMPLEMENTED = 5,
        DEPTH_LIMIT = 6,
    }

    class TProtocolException implements Error {
        name: string;
        message: string;
        type: TProtocolExceptionType;

        constructor(type: TProtocolExceptionType, message: string);
    }

    function objectLength(obj: any): number;
}
