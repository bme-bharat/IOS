import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableWithoutFeedback,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
    StyleSheet,
} from 'react-native';
import apiClient from '../ApiClient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { showToast } from '../AppUtils/CustomToast';
import { useNetwork } from '../AppUtils/IdProvider';
import { colors } from '../../assets/theme';

const ContactSupplierModal = ({ visible, onClose, company_id }) => {
    const { myId, myData } = useNetwork();
    const [contactDetails, setContactDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    const openDialPad = (number) => {
        const url = `tel:${number}`;
        Linking.openURL(url).catch(() => {
            showToast("Unable to open the dialer. Please check your device settings", 'error');
        });
    };

    const viewResume = async () => {
        try {
            if (!contactDetails?.target_user_resume_key) {

                return;
            }

            const response = await apiClient.post('/getObjectSignedUrl', {
                command: 'getObjectSignedUrl',
                key: contactDetails.target_user_resume_key,
            });

            const signedUrl = typeof response.data === 'string' ? response.data : response.data?.url;

            if (signedUrl) {
                const supported = await Linking.canOpenURL(signedUrl);
                if (supported) {
                    Linking.openURL(signedUrl);
                } else {
                    showToast("Cannot open the resume URL on this device", 'error');
                }
            } else {
                showToast("Failed to retrieve resume", 'error');
            }
        } catch (err) {

            showToast("An error occurred while opening the resume", 'error');
        }
    };

    const getJobSeekersContactDetails = async () => {
        try {
            setLoading(true);

            const response = await apiClient.post('/getContactDetails', {
                command: 'getContactDetails',
                target_user_id: company_id,
                user_id: myId,
            });

            if (response?.data?.status === 'success') {
                setContactDetails(response.data.response);

            } else {

                setContactDetails(null);
            }
        } catch (error) {

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            getJobSeekersContactDetails();
        }
    }, [visible]);

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.contactModalBackdrop}>
                    <TouchableWithoutFeedback>
                        <View style={styles.contactModalBox}>
                            {loading ? (
                                <ActivityIndicator size="small" color='#075cab' />
                            ) : contactDetails ? (
                                <View style={styles.contentContainer}>
                                    {contactDetails.target_user_name && (
                                        <Text style={styles.companyName}>{contactDetails.target_user_name}</Text>
                                    )}

                                    {contactDetails.target_user_phone_number && (
                                        <TouchableOpacity
                                            onPress={() => openDialPad(contactDetails.target_user_phone_number)}
                                            style={styles.actionButton}
                                        >
                                            <Text style={styles.actionButtonText}>{contactDetails.target_user_phone_number}</Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* {contactDetails.target_user_resume_key && (
                                        <TouchableOpacity style={styles.actionButton} onPress={viewResume}>
                                            <Text style={styles.actionButtonText}>View Resume</Text>
                                        </TouchableOpacity>
                                    )} */}

                                    <View style={styles.successMessageRow}>
                                        <Icon name="warning" size={18} color="#ccc" style={styles.warningIcon} />
                                        <Text style={styles.contactModalMessage}>{contactDetails.successMessage}</Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.contactModalLoading}>Failed to load contact details.</Text>
                            )}
                        </View>

                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};


const styles = StyleSheet.create({
    contactModalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 20,
    },

    contactModalBox: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },

    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },

    companyName: {
        fontWeight: '600',
        fontSize: 16,
        color: colors.text_primary,
        textAlign: 'center',
    },

    actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
        width: '70%',
        alignItems: 'center',
    },

    actionButtonText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 16,
    },

    successMessageRow: {
        flexDirection: 'row',
        marginTop: 12,
    },

    warningIcon: {
        marginRight: 6,
    },

    contactModalMessage: {
        fontSize: 13,
        color: colors.text_secondary,
        textAlign: 'center',
        fontWeight: '500',
    },

    contactModalLoading: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingVertical: 20,
    },

    contactLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        width: 60,
    },

    contactValue: {
        fontSize: 15,
        color: '#075cab',
        flexShrink: 1,
        paddingHorizontal: 10,
    },
});


export default ContactSupplierModal;
