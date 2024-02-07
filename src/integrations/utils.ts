import { AxiosRequestConfig, default as axios } from "axios";
import { logger } from "../consts";

export const httpGet = async (
  url: string,
  authorization: string,
): Promise<any> => {
  try {
    const config: AxiosRequestConfig = {
      headers: { Authorization: authorization },
    };
    return await axios.get(url, config);
  } catch (error) {
    logger.error(error);
  }
};
