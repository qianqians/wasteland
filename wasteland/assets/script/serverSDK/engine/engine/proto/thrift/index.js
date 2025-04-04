/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
module.exports.Thrift = require('./thrift.js');

var log = require('./log.js');
module.exports.setLogFunc = log.setLogFunc;
module.exports.setLogLevel = log.setLogLevel;
module.exports.getLogLevel = log.getLogLevel;

module.exports.Int64 = require('./Int64.js');
//module.exports.Q = require('q');

/*
 * Export transport and protocol so they can be used outside of a
 * cassandra/server context
 */
module.exports.TBufferedTransport = require('./buffered_transport.js');
module.exports.TFramedTransport = require('./framed_transport.js');

module.exports.TJSONProtocol = require('./json_protocol.js');
module.exports.TBinaryProtocol = require('./binary_protocol.js');
module.exports.TCompactProtocol = require('./compact_protocol.js');
module.exports.THeaderProtocol = require('./header_protocol.js');
