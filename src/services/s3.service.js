const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET_NAME_1 = "stylistuserprofilepictures";
const BUCKET_NAME_2 = "stylistuserclosetpictures";
const BUCKET_NAME_3 = "stylistdummypics";
const BUCKET_NAME_4 = "stylistclosetpicturesnew";
const BUCKET_NAME_5 = "vetirchatmedia"

module.exports.uploadProfilePicToS3 = async (base64Data) => {
  const fileName = Date.now().toString() + ".png";
  const params = {
    Bucket: BUCKET_NAME_1,
    acl: "public-read",
    ContentEncoding: "base64",
    ContentType: base64Data[1],
    Key: fileName,
    Body: Buffer.from(base64Data[2], "base64"),
  };
  return s3.upload(params).promise();
};

module.exports.uploadClosetPicToS3 = async (base64Data) => {
  const fileName = Date.now().toString() + ".png";
  const params = {
    Bucket: BUCKET_NAME_2,
    acl: "public-read",
    ContentEncoding: "base64",
    ContentType: base64Data[1],
    Key: fileName,
    Body: Buffer.from(base64Data[2], "base64"),
  };
  return s3.upload(params).promise();
};

module.exports.uploadDummyPicToS3 = async (base64Data) => {
  const fileName = Date.now().toString() + ".png";
  const params = {
    Bucket: BUCKET_NAME_3,
    acl: "public-read",
    ContentEncoding: "base64",
    ContentType: base64Data[1],
    Key: fileName,
    Body: Buffer.from(base64Data[2], "base64"),
  };
  return s3.upload(params).promise();
};

module.exports.getImageDetails = async () => {
  const params = {
    Bucket: BUCKET_NAME_3,
  };
  return s3.listObjects(params).promise()
};

module.exports.uploadMediaToS3 = async (base64Data, contentType, isImage) => {
  try {
    const fileName = Date.now().toString() + (isImage ? ".png" : ".mp4");

    const params = {
      Bucket: BUCKET_NAME_5,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: contentType,
      Key: fileName,
      Body: Buffer.from(base64Data, "base64"),
    };

    const uploadFileResult = await s3.upload(params).promise();

    return uploadFileResult.Location;
  } catch (error) {
    console.error("Error uploading media to S3:", error);
    throw error;
  }
};

module.exports.uploadVideoToS3 = async () => {
  try {
    const fileName = Date.now().toString() + ".mp4";

    const params = {
      Bucket: BUCKET_NAME_5,
      Key: fileName, 
      Expires: 36000, 
      ContentType: 'video/mp4',
      Metadata: {"Content-Type": 'video/mp4'}
    };
    
    const presignedUrl = s3.getSignedUrl('putObject', params);
    return presignedUrl;
  } catch (error) {
    console.error("Error making presignedUrl for uploading video to S3:", error);
    throw error;
  }
}