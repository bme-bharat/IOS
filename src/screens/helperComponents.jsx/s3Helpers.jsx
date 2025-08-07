import apiClient from "../ApiClient";

export const deleteS3KeyIfExists = async (key) => {
  if (!key) {
    return;
  }

  try {
    const res = await apiClient.post('/deleteFileFromS3', {
      command: 'deleteFileFromS3',
      key,
    });

    const { statusCode, message } = res?.data || {};

    if (statusCode === 200) {
      console.log(`✅ [deleteS3KeyIfExists] ${message}`);
    } else {

    }
  } catch (err) {

  }
};
