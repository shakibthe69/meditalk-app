import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { palette, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { Button, Card } from '../../src/components';
import { doctorPortalApi } from '../../src/services/api';
import { DoctorPost } from '../../src/types';
import { Plus, Trash2, Megaphone, X, Camera, ImageIcon } from 'lucide-react-native';

const CATEGORIES = ['HEALTH_TIP', 'NOTICE', 'ALERT', 'CAMPAIGN'];

export default function DoctorPostsScreen() {
  const [posts, setPosts] = useState<DoctorPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('HEALTH_TIP');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    try {
      const data = await doctorPortalApi.getMyPosts();
      setPosts(data);
    } catch (err) {
      console.log('Error loading posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  const handlePickImage = async (fromCamera: boolean) => {
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera / Media Library permission is required.');
        return;
      }

      const res = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedImageUri(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!title.trim() || !body.trim()) {
      setError('Please add a title and health advice message.');
      return;
    }
    setIsSaving(true);
    try {
      let uploadedImageUrl: string | undefined = undefined;
      if (selectedImageUri) {
        uploadedImageUrl = await doctorPortalApi.uploadPostImage(selectedImageUri);
      }

      await doctorPortalApi.createPost({
        title: title.trim(),
        body: body.trim(),
        category,
        imageUrl: uploadedImageUrl,
      });

      setTitle('');
      setBody('');
      setCategory('HEALTH_TIP');
      setSelectedImageUri(null);
      setShowCompose(false);
      await loadPosts();
    } catch (err) {
      console.log('Error creating post:', err);
      setError('Could not publish the update. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (post: DoctorPost) => {
    Alert.alert('Delete Update', `Delete "${post.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await doctorPortalApi.deletePost(post.id);
            await loadPosts();
          } catch (err) {
            console.log('Error deleting post:', err);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Health Updates & News</Text>
          <Text style={styles.headerSub}>Publish medical advisories & tips to patients</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() => setShowCompose(true)}
        >
          <Plus size={18} color={palette.white} />
          <Text style={styles.addBtnText}>New Post</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={palette.teal600} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerWrap}>
          <Megaphone size={44} color={palette.slate300} />
          <Text style={styles.emptyTitle}>No health news or updates yet</Text>
          <Text style={styles.emptySubtitle}>
            Share medical advice, awareness campaigns, and health alerts with all patients.
          </Text>
          <Button
            title="Publish First Update"
            onPress={() => setShowCompose(true)}
            size="sm"
            style={{ marginTop: spacing.md }}
          />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.postList}
          renderItem={({ item }) => (
            <Card style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.postTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.postDate}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }) : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color={palette.danger500} />
                </TouchableOpacity>
              </View>

              {item.imageUrl ? (
                <View style={styles.postImageWrapper}>
                  <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
                </View>
              ) : null}

              <Text style={styles.postBody} numberOfLines={6}>
                {item.body}
              </Text>

              <View style={styles.postFooter}>
                <Badgeish category={item.category} />
              </View>
            </Card>
          )}
        />
      )}

      {/* Compose News Modal */}
      <Modal visible={showCompose} animationType="slide" transparent onRequestClose={() => setShowCompose(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Health Update</Text>
              <TouchableOpacity onPress={() => setShowCompose(false)}>
                <X size={22} color={palette.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TextInput
                style={styles.input}
                placeholder="Title (e.g., Seasonal Flu Prevention & Hydration)"
                placeholderTextColor={palette.slate400}
                value={title}
                onChangeText={setTitle}
                maxLength={150}
              />

              <TextInput
                style={[styles.input, styles.bodyInput]}
                placeholder="Write full health advice or announcement for patients..."
                placeholderTextColor={palette.slate400}
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
              />

              {/* Category selector */}
              <Text style={styles.sectionLabel}>Post Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.categoryChip, category === c && styles.categoryChipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === c && styles.categoryTextActive,
                      ]}
                    >
                      {c.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Photo Upload Section */}
              <Text style={styles.sectionLabel}>Add News Banner or Medical Photo (Optional)</Text>
              {selectedImageUri ? (
                <View style={styles.previewImageContainer}>
                  <Image source={{ uri: selectedImageUri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setSelectedImageUri(null)}
                  >
                    <X size={16} color={palette.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPickerRow}>
                  <TouchableOpacity
                    style={styles.photoPickerBtn}
                    onPress={() => handlePickImage(true)}
                  >
                    <Camera size={18} color={palette.teal700} />
                    <Text style={styles.photoPickerText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoPickerBtn}
                    onPress={() => handlePickImage(false)}
                  >
                    <ImageIcon size={18} color={palette.teal700} />
                    <Text style={styles.photoPickerText}>Choose Image</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Button
                title="Publish Update"
                onPress={handleCreate}
                loading={isSaving}
                fullWidth
                style={{ marginTop: spacing.sm }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** Small colored label for post category. */
const Badgeish: React.FC<{ category?: string }> = ({ category }) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    ALERT: { bg: palette.danger50, text: palette.danger600 },
    HEALTH_TIP: { bg: palette.success50, text: palette.success600 },
    CAMPAIGN: { bg: palette.blue50, text: palette.blue600 },
    NOTICE: { bg: palette.warning50, text: palette.warning600 },
  };
  const colors = colorMap[category || 'HEALTH_TIP'] || colorMap.NOTICE;
  return (
    <View style={[styles.catBadge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.catBadgeText, { color: colors.text }]}>
        {(category || 'HEALTH_TIP').replace('_', ' ')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: palette.slate900,
  },
  headerSub: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.teal600,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: borderRadius.full,
  },
  addBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.white,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate700,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: palette.slate500,
    textAlign: 'center',
  },
  postList: {
    padding: spacing.base,
    gap: spacing.md,
  },
  postCard: {
    marginBottom: 0,
    borderRadius: borderRadius.xl,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  postTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.slate900,
  },
  postDate: {
    fontSize: typography.sizes.xs,
    color: palette.slate400,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  postImageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginVertical: spacing.sm,
    backgroundColor: palette.slate100,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postBody: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  catBadgeText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: borderRadius['2xl'] ?? 24,
    borderTopRightRadius: borderRadius['2xl'] ?? 24,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: palette.slate900,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.slate700,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: palette.danger600,
    textAlign: 'center',
  },
  input: {
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: palette.slate900,
  },
  bodyInput: {
    minHeight: 100,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.slate50,
  },
  categoryChipActive: {
    borderColor: palette.teal600,
    backgroundColor: palette.teal600,
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate700,
  },
  categoryTextActive: {
    color: palette.white,
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
  },
  photoPickerText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.teal800,
  },
  previewImageContainer: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: palette.slate100,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
