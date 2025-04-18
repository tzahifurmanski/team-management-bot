// eslint-disable-next-line @typescript-eslint/no-unused-vars
const healthcheck = async ({ req, res }: any) => {
  res.sendStatus(200);
};

export default healthcheck;
