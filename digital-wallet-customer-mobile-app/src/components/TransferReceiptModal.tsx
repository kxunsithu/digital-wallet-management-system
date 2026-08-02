// components/TransferReceiptModal.tsx
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import CustomToast from './CustomToast';
import { useTheme } from '../providers/ThemeProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { getAutoSaveReceipt } from '../services/settingsStore';

let MediaLibrary: typeof import('expo-media-library') | null = null;
try {
  MediaLibrary = require('expo-media-library');
} catch {
  MediaLibrary = null;
}

export interface ReceiptTransaction {
  id?: number;
  transaction_number: string;
  transaction_type: string;
  amount: number;
  fee: number;
  sender_name?: string | null;
  sender_phone?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  description?: string | null;
  status?: string;
  created_at?: string | null;
}

interface TransferReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: ReceiptTransaction | null;
}

const formatAmount = (val: number) =>
  new Intl.NumberFormat('en-MM', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);

const formatType = (type: string) => (type || '').replace(/_/g, ' ').toUpperCase();

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return new Date().toLocaleString();
  return new Date(dateStr).toLocaleString();
};

export default function TransferReceiptModal({
  visible,
  onClose,
  transaction,
}: TransferReceiptModalProps) {
  const { theme, colors } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef<any>(null);
  const lastAutoSavedRef = useRef<string | null>(null);

  // Capture receipt as PNG
  const captureReceiptAsPNG = useCallback(async (): Promise<string | null> => {
    if (!viewShotRef.current) {
      Toast.show({ type: 'error', text1: t('receipt.view_not_ready'), text2: '' });
      return null;
    }

    try {
      const uri = await viewShotRef.current.capture();
      return uri;
    } catch (e: any) {
      console.error('[Receipt] Capture Error:', e);
      Toast.show({ type: 'error', text1: t('receipt.capture_failed'), text2: e?.message ?? '' });
      return null;
    }
  }, []);

  // Save PNG to device
  const savePNGFile = useCallback(async (imageUri: string, tx: ReceiptTransaction): Promise<string | null> => {
    try {
      const safeName = tx.transaction_number.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Receipt_${safeName}.png`;
      
      // Use document directory for saving
      const saveDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
      const fileUri = saveDir + fileName;

      // Copy the captured image
      await FileSystem.copyAsync({
        from: imageUri,
        to: fileUri,
      });

      // Verify file was saved
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File was not saved successfully');
      }

      Toast.show({ 
        type: 'success', 
        text1: t('receipt.save'), 
        text2: t('receipt.saved_as', { fileName }) 
      });

      return fileUri;
    } catch (e: any) {
      console.error('[Receipt] Save PNG Error:', e);
      Toast.show({ 
        type: 'error', 
        text1: t('receipt.save_failed'), 
        text2: e?.message ?? '' 
      });
      return null;
    }
  }, []);

  // Save to Gallery (for Expo Go users)
  const saveToGallery = useCallback(async (imageUri: string, tx: ReceiptTransaction): Promise<boolean> => {
    if (!MediaLibrary?.requestPermissionsAsync || !MediaLibrary?.Asset || !MediaLibrary?.Album) {
      const localPath = await savePNGFile(imageUri, tx);
      return Boolean(localPath);
    }

    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ 
          type: 'error', 
          text1: t('receipt.permission_denied'), 
          text2: '' 
        });
        return false;
      }

      // Save to gallery (new class-based API)
      const asset = await MediaLibrary.Asset.create(imageUri);
      const existingAlbum = await MediaLibrary.Album.get('Digital Wallet Receipts');
      if (existingAlbum) {
        await existingAlbum.add(asset);
      } else {
        await MediaLibrary.Album.create('Digital Wallet Receipts', [asset], false);
      }
      
      Toast.show({ 
        type: 'success', 
        text1: t('receipt.saved_to_gallery'), 
        text2: '' 
      });
      return true;
    } catch (e: any) {
      console.error('[Receipt] Save to Gallery Error:', e);
      Toast.show({ 
        type: 'error', 
        text1: t('receipt.gallery_save_failed'), 
        text2: e?.message ?? '' 
      });
      return false;
    }
  }, [savePNGFile]);

  // Handle Save as PNG
  const handleSavePNG = useCallback(async () => {
    if (!transaction || saving) return;
    
    setSaving(true);
    try {
      const imageUri = await captureReceiptAsPNG();
      if (!imageUri) return;

      // Save to gallery when MediaLibrary is available; otherwise fallback to app documents.
      await saveToGallery(imageUri, transaction);
    } catch (e: any) {
      Toast.show({ 
        type: 'error', 
        text1: t('receipt.save_failed'), 
        text2: e?.message ?? '' 
      });
    } finally {
      setSaving(false);
    }
  }, [transaction, saving, captureReceiptAsPNG, savePNGFile, saveToGallery]);

  // Handle Share
  const handleShare = useCallback(async () => {
    if (!transaction || sharing) return;
    
    setSharing(true);
    try {
      const imageUri = await captureReceiptAsPNG();
      if (!imageUri) return;

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: t('receipt.share'),
          UTI: 'public.png',
        });
      } else {
        // Fallback if not available
        await Share.share({
          title: `Receipt-${transaction.transaction_number}`,
          url: imageUri,
        });
      }
      
      Toast.show({ 
        type: 'success', 
        text1: t('receipt.shared'), 
        text2: t('receipt.shared_desc') 
      });
    } catch (e: any) {
      console.error('[Receipt] Share Error:', e);
      Toast.show({ 
        type: 'error', 
        text1: t('receipt.share_failed'), 
        text2: e?.message ?? t('receipt.share_failed_desc') 
      });
    } finally {
      setSharing(false);
    }
  }, [transaction, sharing, captureReceiptAsPNG]);

  // Auto-save: fires when modal becomes visible with a new transaction
  useEffect(() => {
    if (!visible || !transaction) return;
    const txId = transaction.transaction_number;

    if (lastAutoSavedRef.current === txId) return;

    (async () => {
      const autoSave = await getAutoSaveReceipt();
      if (autoSave) {
        lastAutoSavedRef.current = txId;
        setTimeout(() => {
          handleSavePNG();
        }, 800);
      }
    })();
  }, [visible, transaction, handleSavePNG]);

  if (!transaction) return null;

  const formattedAmount = formatAmount(transaction.amount);
  const formattedFee = formatAmount(transaction.fee);
  const formattedType = formatType(transaction.transaction_type);
  const formattedDate = formatDate(transaction.created_at);

  const DetailRow = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6 }}>
      <Text style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text
        style={{
          fontSize: mono ? 11 : 13,
          fontWeight: '700',
          color: colors.text,
          fontFamily: mono ? 'monospace' : undefined,
          maxWidth: '58%',
          textAlign: 'right',
        }}
        numberOfLines={mono ? 1 : 2}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: `${colors.secondary}B3` }}>
        <View
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            maxHeight: '92%',
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 36 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: `${colors.primary}20`,
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}
                >
                  <Feather name="check-circle" size={22} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                    {t('receipt.title')}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                    {t('receipt.subtitle')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: isDark ? colors.background : `${colors.border}33`,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Feather name="x" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* ViewShot wrapper for capturing receipt as PNG */}
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0 }}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              {/* Receipt Content */}
              <View style={{ padding: 20 }}>
                {/* Amount Card */}
                <View
                  style={{
                    padding: 20, borderRadius: 16,
                    backgroundColor: isDark ? colors.secondary : colors.surface,
                    borderWidth: 1, borderColor: colors.border,
                    alignItems: 'center', marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10, fontWeight: '700',
                      color: isDark ? colors.textSecondary : colors.text,
                      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
                    }}
                  >
                    {t('receipt.amount_transferred')}
                  </Text>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text }}>
                    {formattedAmount}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? colors.textSecondary : colors.secondary }}> {t('common.mmk')}</Text>
                  </Text>
                  <View
                    style={{
                      marginTop: 10, paddingHorizontal: 14, paddingVertical: 4,
                      borderRadius: 12, backgroundColor: `${colors.primary}14`,
                      borderWidth: 1, borderColor: `${colors.primary}33`,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>● {t('receipt.completed')}</Text>
                  </View>
                </View>

                {/* Transaction Details */}
                <View
                  style={{
                    borderRadius: 16,
                    backgroundColor: isDark ? colors.secondary : colors.surface,
                    borderWidth: 1, borderColor: colors.border,
                    padding: 16,
                  }}
                >
                  <DetailRow label={t('receipt.txn_no')} value={transaction.transaction_number} mono />
                  <DetailRow label={t('receipt.transfer_type')} value={formattedType} />
                  <DetailRow label={t('receipt.date_time')} value={formattedDate} />

                  <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: colors.border, marginVertical: 12 }} />

                  <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? colors.textSecondary : colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    {t('receipt.sender_details')}
                  </Text>
                  <DetailRow label={t('receipt.name')} value={transaction.sender_name || '—'} />
                  <DetailRow label={t('receipt.phone')} value={transaction.sender_phone || '—'} />

                  <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: colors.border, marginVertical: 12 }} />

                  <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? colors.textSecondary : colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    {t('receipt.receiver_details')}
                  </Text>
                  <DetailRow label={t('receipt.name')} value={transaction.receiver_name || '—'} />
                  <DetailRow label={t('receipt.phone')} value={transaction.receiver_phone || '—'} />

                  <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: colors.border, marginVertical: 12 }} />

                  <DetailRow label={t('receipt.fee')} value={`${formattedFee} ${t('common.mmk')}`} />
                  <DetailRow label={t('receipt.description')} value={transaction.description || '—'} />
                </View>

                {/* Footer */}
                <Text style={{
                  textAlign: 'center',
                  marginTop: 16,
                  fontSize: 10,
                  color: isDark ? colors.textSecondary : colors.secondary,
                }}>
                  {t('receipt.footer')}
                </Text>
              </View>
            </ViewShot>
            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSavePNG}
                disabled={saving || sharing}
                activeOpacity={0.85}
                style={{ 
                  flex: 1,
                  opacity: (saving || sharing) ? 0.7 : 1 
                }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 15, borderRadius: 16,
                    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <Feather name="download" size={17} color={colors.secondary} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.secondary }}>
                        {t('receipt.save')}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Share Button */}
              <TouchableOpacity
                onPress={handleShare}
                disabled={saving || sharing}
                activeOpacity={0.85}
                style={{ 
                  flex: 1,
                  opacity: (saving || sharing) ? 0.7 : 1 
                }}
              >
                <View
                  style={{
                    paddingVertical: 15, borderRadius: 16,
                    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
                    backgroundColor: colors.border,
                  }}
                >
                  {sharing ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <Feather name="share-2" size={17} color={colors.text} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                        {t('receipt.share')}
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Done Button */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                marginTop: 10,
                paddingVertical: 15, borderRadius: 16,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? colors.textSecondary : colors.secondary }}>
                {t('receipt.done')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <Toast
          config={{
            success: (props: any) => <CustomToast {...props} />,
            error: (props: any) => <CustomToast {...props} />,
            info: (props: any) => <CustomToast {...props} />,
          }}
        />
      </View>
    </Modal>
  );
}