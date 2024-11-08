
// Axios
import axios from "axios";

export const downloadFileFromURL = async (url) => {
    const response = await axios.get(url, {
        responseType: "arraybuffer",
    });
    return response.data;
};