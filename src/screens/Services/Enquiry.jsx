import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentPicker from 'react-native-document-picker';

import RNFS from 'react-native-fs';
import apiClient from '../ApiClient';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import AppStyles from '../AppUtils/AppStyles';


const EnquiryForm = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { company_id, service_id } = route.params || {};
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedPDF, setSelectedPDF] = useState(null);
  const { myId, myData } = useNetwork();

  
  
  
const handleEnquire = async () => {
    if (!description.trim()) {
      showToast("Description is mandatory", 'info');
      return; // before loading set, so safe
    }
  
    setLoading(true);
  
    try {
      let uploadedFileKey = null;
      if (selectedPDF) {
        uploadedFileKey = await uploadFileToS3(selectedPDF.uri, selectedPDF.type);
        if (!uploadedFileKey) {
          showToast("Failed to upload PDF", "error");
          // don't return here, but throw to catch
          throw new Error("Upload failed");
        }
      }
  
      const payload = {
        command: 'enquireService',
        company_id,
        user_id: myId,
        service_id,
        enquiry_fileKey: uploadedFileKey,
        enquiry_description: description,
      };
  
      const response = await fetch(
        'https://h7l1568kga.execute-api.ap-south-1.amazonaws.com/dev/enquireService',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
  
      const result = await response.json();
  
      if (!response.ok || result.status !== 'success') {
        const errorMessage = result?.errorMessage || "Submission failed";
        showToast(errorMessage, 'error');
  
        if (errorMessage === "You already enquired this service.") {
          setTimeout(() => navigation.goBack(), 100);
        }
  
        throw new Error(errorMessage);
      }
  
      showToast("Enquiry submitted successfully", 'success');
      setDescription('');
      setSelectedPDF(null);

      setTimeout(() => navigation.goBack(), 100);
  
    } catch (error) {
      // error handling here, loading false in finally
      if (error.message !== "You already enquired this service.") {
        setSelectedPDF(null);
      }
    } finally {
      setLoading(false);
    }
  };
  


    const selectDocument = async () => {
        if (selectedPDF) {
            showToast("You can only upload 1 document", 'error');

            return;
        }

        try {
            const res = await DocumentPicker.pick({
                type: [
                    DocumentPicker.types.pdf,
                    DocumentPicker.types.docx,
                    DocumentPicker.types.xlsx,
                    DocumentPicker.types.plainText,
                    DocumentPicker.types.pptx,
                    DocumentPicker.types.ppt,

                ],
            });

            if (res[0].size > 5 * 1024 * 1024) {
                return showToast("File size shouldn't exceed 5MB", 'error');

            }

            setSelectedPDF({
                uri: res[0].uri,
                name: res[0].name,
                type: res[0].type,
                size: (res[0].size / (1024 * 1024)).toFixed(2),
            });
        } catch (error) {
            if (!DocumentPicker.isCancel(error)) {

                showToast("Error selecting document", 'error');

            }
        }
    };




    const uriToBlob = async (uri) => {
        const response = await fetch(uri);
        return await response.blob();
    };

    const uploadFileToS3 = async (fileUri, fileType) => {
        try {
            const fileStat = await RNFS.stat(fileUri);

            const res = await apiClient.post('/uploadFileToS3', {
                command: 'uploadFileToS3',
                headers: {
                    'Content-Type': fileType,
                    'Content-Length': fileStat.size,
                },
            });

            if (res.data.status === 'success') {
                const uploadUrl = res.data.url;
                const fileKey = res.data.fileKey;

                const fileBlob = await uriToBlob(fileUri);
                const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': fileType },
                    body: fileBlob,
                });

                if (uploadRes.status === 200) {

                    return fileKey;
                } else {
                    throw new Error(`Failed to upload ${fileType} to S3`);
                }
            } else {
                throw new Error(res.data.errorMessage || 'Failed to get upload URL');
            }
        } catch (error) {
            showToast("Upload failed", 'error');

            return null;
        }
    };

    const removeMedia = (type, index) => {

        if (type === 'document') setSelectedPDF(null); // No index needed for a single PDF
    };
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#075cab" />
                </TouchableOpacity>
            </View >
            <ScrollView style={styles.container1}>

                <Text style={styles.label}>Enquiry Description:</Text>
                <TextInput
                    style={styles.input}
                    multiline
                    value={description}
                    onChangeText={(text) => {
                        // Remove leading spaces only
                        const cleanedText = text.replace(/^\s+/, '');
                        setDescription(cleanedText);
                    }}
                    placeholder="Type your enquiry here"
                />


                <View style={styles.mediaContainer}>
                    {selectedPDF ? (
                        <View style={[styles.mediaWrapper, { padding: 15 }]}>
                          <Icon name="file-document-outline" size={50} color="black" />

                            <Text numberOfLines={1} style={[styles.documentName, { marginTop: 5 }]}>
                                {selectedPDF.name}
                            </Text>

                            <TouchableOpacity style={styles.closeIcon} onPress={() => removeMedia('document')}>
                                <Icon name="close" size={20} color="gray" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.placeholder} onPress={selectDocument}>
                           <Icon name="cloud-upload-outline" size={40} color="gray" />

                            <Text style={styles.placeholderText}>Upload file</Text>
                        </TouchableOpacity>
                    )}
                </View>


                <TouchableOpacity
                    onPress={handleEnquire}
                    style={[
                        AppStyles.Postbtn,
                        (loading || !description.trim()) && styles.disabledButton,
                    ]}
                    disabled={loading || !description.trim()}
                >
                    <Text style={[
                        AppStyles.PostbtnText,
                        (loading || !description.trim()) && styles.buttonDisabledText,
                    ]}>
                        {loading ? 'Submitting' : 'Submit'}
                    </Text>
                </TouchableOpacity>



            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,

    },
    container1: {
        flex: 1,
        // backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingTop: 10
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'whitesmoke',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,

    },

    backButton: {
        padding: 10,
        alignSelf: 'flex-start',
    },
    button: {
        width: 140,
        // backgroundColor: '#075cab',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 20,
    },
    disabledButton: {
        backgroundColor: '#ccc',
        borderColor: '#ccc',
        borderWidth: 0.5,
      },

    buttonDisabledText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        textAlignVertical: 'top',
        minHeight: 200,
        maxHeight: 400,
        marginBottom: 20,
        backgroundColor: '#fafafa',
    },
    mediaContainer: {
        marginBottom: 20,
    },
    mediaWrapper: {
        position: 'relative',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    documentName: {
        fontSize: 14,
        color: '#333',
        maxWidth: 180,
        textAlign: 'center',
    },
    closeIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#eee',
        borderRadius: 12,
        padding: 2,
    },
    placeholder: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    placeholderText: {
        fontSize: 14,
        color: '#888',
    },
});


export default EnquiryForm;



