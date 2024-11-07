// Mammoth
import mammoth from "mammoth";

// Child process
import { exec } from "child_process";

// Axios
import axios from "axios";

// Cheerio
import * as cheerio from "cheerio";

export const downloadFileFromURL = async (url) => {
    const response = await axios.get(url, {
        responseType: "arraybuffer",
    });
    return response.data;
};

export const parseDocx = async (file) => {
    const result = await mammoth.extractRawText({ buffer: file });
    return result.value;
};

export const downloadTextFromWebPage = async (url) => {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    return $("body").text();
};

export const parseKeyOrPages = async (filePath) => {
    return new Promise((resolve, reject) => {
        exec(
            `textutil -convert txt -stdout "${filePath}"`,
            (error, stdout, stderr) => {
                if (error) {
                    reject(`Error parsing file: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            }
        );
    });
};
