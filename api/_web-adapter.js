function getRequestUrl(request) {
  if (request.url?.startsWith('http')) {
    return request.url;
  }

  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers.host || 'localhost';

  return `${protocol}://${host}${request.url || '/'}`;
}

function getRequestBody(request, method) {
  if (method === 'GET' || method === 'HEAD') {
    return undefined;
  }

  if (request.body !== undefined && request.body !== null) {
    if (typeof request.body === 'string' || Buffer.isBuffer(request.body)) {
      return request.body;
    }

    return JSON.stringify(request.body);
  }

  return request;
}

function toWebRequest(request) {
  if (request instanceof Request) {
    return request;
  }

  const method = request.method || 'GET';
  const body = getRequestBody(request, method);
  const init = {
    method,
    headers: request.headers,
  };

  if (body) {
    init.body = body;
    init.duplex = 'half';
  }

  return new Request(getRequestUrl(request), init);
}

async function sendWebResponse(response, webResponse) {
  response.statusCode = webResponse.status;

  webResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });

  const body = await webResponse.arrayBuffer();
  response.end(Buffer.from(body));
}

export function withWebHandler(handler) {
  return async function adaptedHandler(request, response) {
    const webResponse = await handler(toWebRequest(request));

    if (!response) {
      return webResponse;
    }

    return sendWebResponse(response, webResponse);
  };
}
