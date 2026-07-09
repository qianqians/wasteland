import { Request, Response, type MessageFns } from "./underlying";

export type WRpcCodec<T> = Pick<MessageFns<T>, "encode" | "decode">;

export class Result<T> {
  ErrMsg = "";
  Content?: T;
}

export class ResultOnly {
  ErrMsg = "";
}

export class WRpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WRpcError";
  }
}

export class WRpc {
  private readonly uri: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(uri: string, token: string, timeoutMs = 10000) {
    this.uri = uri;
    this.token = token;
    this.timeoutMs = timeoutMs;
  }

  async Notify<T>(methodName: string, content: T, codec: WRpcCodec<T>): Promise<ResultOnly> {
    const response = await this.send(methodName, content, codec, `WRpc.Notify(${methodName})`);
    const ret = new ResultOnly();
    ret.ErrMsg = response.errMsg;
    return ret;
  }

  async Request<TResponse, TRequest>(
    methodName: string,
    content: TRequest,
    responseCodec: WRpcCodec<TResponse>,
    requestCodec: WRpcCodec<TRequest>,
  ): Promise<Result<TResponse>> {
    const response = await this.send(methodName, content, requestCodec, `WRpc.Request(${methodName})`);
    const ret = new Result<TResponse>();
    ret.ErrMsg = response.errMsg;
    if (!response.errMsg) {
      ret.Content = responseCodec.decode(response.content);
    }
    return ret;
  }

  private async send<T>(
    methodName: string,
    content: T,
    codec: WRpcCodec<T>,
    actionName: string,
  ): Promise<Response> {
    const requestBytes = Request.encode({
      token: this.token,
      protoName: methodName,
      content: codec.encode(content).finish(),
    }).finish();

    const responseBytes = await this.post(requestBytes, actionName);
    return Response.decode(responseBytes);
  }

  private post(body: Uint8Array, actionName: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", this.uri, true);
      xhr.responseType = "arraybuffer";
      xhr.timeout = this.timeoutMs;
      xhr.setRequestHeader("Content-Type", "application/octet-stream");

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new WRpcError(`${actionName} failed: HTTP ${xhr.status} ${xhr.statusText}`.trim()));
          return;
        }

        const responseBytes = xhr.response ? new Uint8Array(xhr.response) : new Uint8Array(0);
        if (responseBytes.length === 0) {
          reject(new WRpcError(`${actionName} failed: empty response body.`));
          return;
        }

        resolve(responseBytes);
      };

      xhr.onerror = () => reject(new WRpcError(`${actionName} failed: network error`));
      xhr.ontimeout = () => reject(new WRpcError(`${actionName} failed: timeout after ${this.timeoutMs}ms`));
      xhr.onabort = () => reject(new WRpcError(`${actionName} failed: request aborted`));

      xhr.send(body);
    });
  }
}
