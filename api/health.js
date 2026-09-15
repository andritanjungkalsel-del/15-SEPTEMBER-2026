module.exports = async function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: "andri-mailtemp-api"
  });
};
