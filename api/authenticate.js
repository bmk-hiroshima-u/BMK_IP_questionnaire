const correctToken = process.env.CORRECT_TOKEN;

module.exports = (req, res) => {
  const { token } = req.query;

  if (token === correctToken) {
    res.status(200).send({ authorized: true });
  } else {
    res.status(401).send({ authorized: false });
  }
};
