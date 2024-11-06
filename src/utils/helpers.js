// S3 Client
import { s3 } from "../config/s3Client.js";

// PDF Parse
import pdfParse from "pdf-parse";

export const getS3Files = async (bucketName, folderPath) => {
    const params = { Bucket: bucketName, Prefix: folderPath };
    const s3Data = await s3.listObjectsV2(params).promise();
    return s3Data.Contents.filter((file) => file.Key !== folderPath);
};

export const downloadFileFromS3 = async (bucketName, filePath) => {
    const params = { Bucket: bucketName, Key: filePath };
    const s3Data = await s3.getObject(params).promise();
    return s3Data.Body;
};

export const parsePDF = async (file) => {
    const pdfData = await pdfParse(file);
    return pdfData.text;
};
