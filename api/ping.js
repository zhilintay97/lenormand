// 诊断用的一行函数：只用来验证 Vercel 到底肯不肯构建 Serverless 函数。
// 不含任何密钥、不做任何事，验证完就删。
export default function handler(req, res) {
  res.status(200).json({ ok: true, pong: true });
}
