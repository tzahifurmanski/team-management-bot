import {AxiosRequestConfig, default as axios} from "axios";

export const httpGet = async (url: string, authorization: string): Promise<any> => {
    try {
        const config:AxiosRequestConfig = {
            headers: {'Authorization': authorization},
        };
        return await axios.get(url, config);
    } catch (error) {
        console.error(error);
    }
}


