// Tiny fakes for Express request and response objects, so middleware can be tested without a server.
const fakeRes = () => {
  const res = { statusCode: 200, headers: {}, body: undefined };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  res.send = (b) => ((res.body = b), res);
  res.set = (k, v) => ((res.headers[k] = v), res);
  return res;
};
const fakeReq = (over = {}) => ({ headers: {}, ip: "203.0.113.9", body: {}, query: {}, get(h) { return this.headers[h.toLowerCase()]; }, ...over });

module.exports = { fakeRes, fakeReq };
