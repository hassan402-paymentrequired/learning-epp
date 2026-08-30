import React from 'react';
import { Modal, View, Image, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { Campaign } from '@/services/campaigns';

interface CampaignPopupModalProps {
  campaign: Campaign;
  visible: boolean;
  onDismiss: () => void;
  /** Label for the dismiss button when there's no CTA, and the secondary button when there is. */
  closeLabel?: string;
}

export function CampaignPopupModal({
  campaign,
  visible,
  onDismiss,
  closeLabel = 'Got it',
}: CampaignPopupModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const handleCtaPress = () => {
    if (campaign.link) {
      Linking.openURL(campaign.link).catch(() => {});
    }
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: textColor + '14' }]}
            onPress={onDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="close" size={18} color={textColor} />
          </TouchableOpacity>

          {campaign.image_url && (
            <Image
              source={{ uri: campaign.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={[styles.content, !campaign.image_url && styles.contentNoImage]}>
            <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={3}>
              {campaign.title}
            </ThemedText>
            {campaign.message && (
              <ThemedText style={styles.message}>{campaign.message}</ThemedText>
            )}
          </View>

          <View style={styles.actions}>
            {campaign.link && campaign.link_text ? (
              <>
                <Button
                  title={campaign.link_text}
                  onPress={handleCtaPress}
                  style={styles.compactButton}
                  textStyle={styles.compactButtonText}
                />
                <Button
                  title={closeLabel}
                  variant="outline"
                  onPress={onDismiss}
                  style={styles.compactButton}
                  textStyle={styles.compactButtonText}
                />
              </>
            ) : (
              <Button
                title={closeLabel}
                onPress={onDismiss}
                style={styles.compactButton}
                textStyle={styles.compactButtonText}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  contentNoImage: {
    // Clears the absolutely-positioned close button when there's no image above it.
    paddingTop: 40,
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    gap: 10,
  },
  compactButton: {
    paddingVertical: 10,
    minHeight: 40,
    borderRadius: 10,
  },
  compactButtonText: {
    fontSize: 14,
  },
});
