// 诊断用：最干净的零配置测试函数。无密钥、无依赖、无 vercel.json、无 package.json。
// 只验证「这个项目在纯零配置下到底建不建 Node 函数」。验完即删。
export default function handler(req, res) {
  res.status(200).json({ ok: true, pong: true });
}
