import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
} from 'react-native';
import { palette, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Badge, DiseaseDetailModal, AiChatPanel } from '../../src/components';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { diseaseApi } from '../../src/services/api/diseaseApi';
import { DiseaseCategory, DiseaseSummary } from '../../src/types';
import { voiceService } from '../../src/services/voice/voiceService';
import {
  Search,
  X,
  BookOpen,
  HeartPulse,
  Activity,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Stethoscope,
  Pill,
  ShieldCheck,
  Languages,
  Volume2,
  VolumeX,
  Flame,
  Info,
  CheckCircle2,
  Bot,
} from 'lucide-react-native';

export default function GuideScreen() {
  const { language, setLanguage, t, voiceEnabled, toggleVoice } = useSettingsStore();

  // "Health Chat" opens on the AI assistant; the directory stays one tap away.
  const [mode, setMode] = useState<'chat' | 'directory'>('chat');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Data State
  const [categories, setCategories] = useState<DiseaseCategory[]>([]);
  const [popularDiseases, setPopularDiseases] = useState<DiseaseSummary[]>([]);
  const [searchResults, setSearchResults] = useState<DiseaseSummary[]>([]);
  const [categoryDiseases, setCategoryDiseases] = useState<DiseaseSummary[]>([]);

  // Loading States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Disease Modal
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Initial Categories & Popular Conditions
  const loadInitialData = useCallback(async () => {
    try {
      setLoadingInitial(true);
      const [cats, popular] = await Promise.all([
        diseaseApi.getCategories(),
        diseaseApi.getPopularDiseases(),
      ]);
      setCategories(cats || []);
      setPopularDiseases(popular || []);
    } catch (error) {
      console.error('Failed to load initial health guide data:', error);
    } finally {
      setLoadingInitial(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Search Execution
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let isMounted = true;
    const executeSearch = async () => {
      setSearching(true);
      try {
        const results = await diseaseApi.searchDiseases(debouncedQuery);
        if (isMounted) {
          setSearchResults(results.content || []);
        }
      } catch (error) {
        console.error('Disease search failed:', error);
        if (isMounted) setSearchResults([]);
      } finally {
        if (isMounted) setSearching(false);
      }
    };

    executeSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Handle Category Selection
  const handleSelectCategory = async (catId: number | null) => {
    if (selectedCategoryId === catId) {
      setSelectedCategoryId(null);
      setCategoryDiseases([]);
      return;
    }

    setSelectedCategoryId(catId);
    if (!catId) {
      setCategoryDiseases([]);
      return;
    }

    try {
      setLoadingCategory(true);
      const diseases = await diseaseApi.getDiseasesByCategory(catId);
      setCategoryDiseases(diseases.content || []);
    } catch (error) {
      console.error(`Failed to load diseases for category ID ${catId}:`, error);
      setCategoryDiseases([]);
    } finally {
      setLoadingCategory(false);
    }
  };

  const handleOpenDisease = (diseaseId: number) => {
    setSelectedDiseaseId(diseaseId);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDiseaseId(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInitialData();
    if (selectedCategoryId) {
      handleSelectCategory(selectedCategoryId);
    }
  };

  // Helper icon for category slug
  const getCategoryIcon = (slug: string) => {
    switch (slug?.toUpperCase()) {
      case 'RESPIRATORY':
        return <Activity size={18} color={palette.teal600} />;
      case 'CARDIOVASCULAR':
        return <HeartPulse size={18} color={palette.coral600} />;
      case 'ENDOCRINE':
        return <Flame size={18} color={palette.amber600} />;
      case 'INFECTIOUS':
        return <AlertTriangle size={18} color={palette.coral500} />;
      case 'DIGESTIVE':
        return <Pill size={18} color={palette.teal700} />;
      case 'NEUROLOGICAL':
        return <Activity size={18} color={palette.purple600} />;
      case 'EMERGENCY':
        return <ShieldCheck size={18} color={palette.coral600} />;
      default:
        return <Stethoscope size={18} color={palette.teal600} />;
    }
  };

  // Determine current active disease list
  const isSearchActive = debouncedQuery.length > 0;
  const isCategoryActive = selectedCategoryId !== null && !isSearchActive;

  return (
    <View style={styles.container}>
      {/* Top Banner & Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconBadge}>
              <BookOpen size={20} color={palette.teal700} />
            </View>
            <View>
              <Text style={styles.headerTitle}>{t.healthGuide}</Text>
              <Text style={styles.headerSubtitle}>
                {mode === 'chat'
                  ? t.aiChatSubtitle
                  : language === 'bn'
                    ? 'বিশ্বস্ত স্বাস্থ্য ও রোগ নির্দেশিকা'
                    : 'Evidence-based disease & medical directory'}
              </Text>
            </View>
          </View>

          {/* Quick Settings: Language & Voice Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.controlPill}
              onPress={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              activeOpacity={0.7}
            >
              <Languages size={15} color={palette.teal700} />
              <Text style={styles.controlPillText}>
                {language === 'en' ? 'বাংলা' : 'English'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.voicePill,
                voiceEnabled && styles.voicePillActive,
              ]}
              onPress={toggleVoice}
              activeOpacity={0.7}
            >
              {voiceEnabled ? (
                <Volume2 size={15} color={palette.white} />
              ) : (
                <VolumeX size={15} color={palette.slate500} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode switch: AI chat assistant ↔ disease directory */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modePill, mode === 'chat' && styles.modePillActive]}
            activeOpacity={0.8}
            onPress={() => setMode('chat')}
          >
            <Bot size={14} color={mode === 'chat' ? palette.white : palette.teal700} />
            <Text style={[styles.modePillText, mode === 'chat' && styles.modePillTextActive]}>
              {t.askAiAction}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modePill, mode === 'directory' && styles.modePillActive]}
            activeOpacity={0.8}
            onPress={() => setMode('directory')}
          >
            <BookOpen size={14} color={mode === 'directory' ? palette.white : palette.teal700} />
            <Text style={[styles.modePillText, mode === 'directory' && styles.modePillTextActive]}>
              {t.directoryAction}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Search Bar (directory mode only) */}
        {mode === 'directory' ? (
          <View style={styles.searchBarWrapper}>
            <Search size={18} color={palette.slate400} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchDiseasePlaceholder}
              placeholderTextColor={palette.slate400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                <X size={16} color={palette.slate500} />
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>

      {/* AI health chat assistant */}
      {mode === 'chat' ? (
        <AiChatPanel
          onOpenDisease={(id) => {
            setMode('directory');
            setSelectedDiseaseId(id);
            setIsDetailModalOpen(true);
          }}
        />
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[palette.teal600]} />
        }
      >
        {/* Loading Initial Data Spinner */}
        {loadingInitial ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.teal600} />
            <Text style={styles.loadingText}>
              {language === 'bn' ? 'স্বাস্থ্য নির্দেশিকা লোড হচ্ছে...' : 'Loading health guide...'}
            </Text>
          </View>
        ) : (
          <>
            {/* Search Results View */}
            {isSearchActive ? (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    {language === 'bn'
                      ? `"${debouncedQuery}" অনুসন্ধানের ফলাফল (${searchResults.length})`
                      : `Search Results for "${debouncedQuery}" (${searchResults.length})`}
                  </Text>
                  {searching && <ActivityIndicator size="small" color={palette.teal600} />}
                </View>

                {searchResults.length === 0 && !searching ? (
                  <Card style={styles.emptyCard}>
                    <Info size={36} color={palette.slate400} />
                    <Text style={styles.emptyTitle}>{t.noDiseasesFound}</Text>
                    <Text style={styles.emptySub}>{t.noDiseasesFoundSub}</Text>
                  </Card>
                ) : (
                  searchResults.map((disease) => (
                    <DiseaseSummaryCard
                      key={disease.id}
                      disease={disease}
                      language={language}
                      onPress={() => handleOpenDisease(disease.id)}
                    />
                  ))
                )}
              </View>
            ) : (
              <>
                {/* Popular Conditions Quick Chips */}
                {popularDiseases.length > 0 && !selectedCategoryId && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={styles.rowCentered}>
                        <Sparkles size={16} color={palette.teal600} style={{ marginRight: 6 }} />
                        <Text style={styles.sectionTitle}>{t.popularConditions}</Text>
                      </View>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.popularScrollContent}
                    >
                      {popularDiseases.map((disease) => {
                        const name = language === 'bn' ? disease.nameBn : disease.nameEn;
                        const subName = language === 'bn' ? disease.nameEn : disease.nameBn;
                        return (
                          <TouchableOpacity
                            key={disease.id}
                            style={styles.popularChip}
                            onPress={() => handleOpenDisease(disease.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.popularChipIcon}>
                              <Activity size={14} color={palette.teal700} />
                            </View>
                            <View>
                              <Text style={styles.popularChipName} numberOfLines={1}>
                                {name}
                              </Text>
                              <Text style={styles.popularChipSub} numberOfLines={1}>
                                {subName}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Browse Medical Categories */}
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.rowCentered}>
                      <Stethoscope size={16} color={palette.teal600} style={{ marginRight: 6 }} />
                      <Text style={styles.sectionTitle}>{t.browseCategories}</Text>
                    </View>
                    {selectedCategoryId && (
                      <TouchableOpacity
                        onPress={() => handleSelectCategory(null)}
                        style={styles.clearCategoryBtn}
                      >
                        <Text style={styles.clearCategoryText}>
                          {language === 'bn' ? 'সকল দেখুন' : 'Show All'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesScrollContent}
                  >
                    {categories.map((cat) => {
                      const isSelected = selectedCategoryId === cat.id;
                      const catName = language === 'bn' ? cat.nameBn : cat.nameEn;

                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryPill,
                            isSelected && styles.categoryPillSelected,
                          ]}
                          onPress={() => handleSelectCategory(cat.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.categoryPillIconWrapper}>
                            {getCategoryIcon(cat.slug)}
                          </View>
                          <Text
                            style={[
                              styles.categoryPillText,
                              isSelected && styles.categoryPillTextSelected,
                            ]}
                          >
                            {catName}
                          </Text>
                          {cat.diseaseCount !== undefined && cat.diseaseCount > 0 && (
                            <View
                              style={[
                                styles.catCountBadge,
                                isSelected && styles.catCountBadgeSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.catCountText,
                                  isSelected && styles.catCountTextSelected,
                                ]}
                              >
                                {cat.diseaseCount}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Category Diseases or All Diseases Directory */}
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                      {selectedCategoryId
                        ? language === 'bn'
                          ? `ক্যাটাগরির রোগসমূহ (${categoryDiseases.length})`
                          : `Category Conditions (${categoryDiseases.length})`
                        : t.allDiseases}
                    </Text>
                    {loadingCategory && <ActivityIndicator size="small" color={palette.teal600} />}
                  </View>

                  {loadingCategory ? (
                    <ActivityIndicator size="small" color={palette.teal600} style={{ marginVertical: 20 }} />
                  ) : isCategoryActive ? (
                    categoryDiseases.length === 0 ? (
                      <Card style={styles.emptyCard}>
                        <Info size={32} color={palette.slate400} />
                        <Text style={styles.emptyTitle}>
                          {language === 'bn' ? 'কোনো রোগ পাওয়া যায়নি' : 'No diseases listed in this category yet'}
                        </Text>
                      </Card>
                    ) : (
                      categoryDiseases.map((disease) => (
                        <DiseaseSummaryCard
                          key={disease.id}
                          disease={disease}
                          language={language}
                          onPress={() => handleOpenDisease(disease.id)}
                        />
                      ))
                    )
                  ) : (
                    // Default view: popular & featured diseases
                    popularDiseases.map((disease) => (
                      <DiseaseSummaryCard
                        key={disease.id}
                        disease={disease}
                        language={language}
                        onPress={() => handleOpenDisease(disease.id)}
                      />
                    ))
                  )}
                </View>

                {/* Medical Safety Disclaimer Footer Card */}
                <Card style={styles.disclaimerCard}>
                  <View style={styles.disclaimerHeader}>
                    <ShieldCheck size={20} color={palette.teal700} />
                    <Text style={styles.disclaimerTitle}>{t.disclaimerTitle}</Text>
                  </View>
                  <Text style={styles.disclaimerText}>{t.educationalDisclaimer}</Text>
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>
      )}

      {/* Complete Rich Disease Detail Modal */}
      {selectedDiseaseId !== null && (
        <DiseaseDetailModal
          visible={isDetailModalOpen}
          diseaseId={selectedDiseaseId}
          onClose={handleCloseModal}
          onSelectRelated={(relatedId: number) => {
            setSelectedDiseaseId(relatedId);
          }}
        />
      )}
    </View>
  );
}

// Sub-Component: Disease Card in List
interface DiseaseSummaryCardProps {
  disease: DiseaseSummary;
  language: 'en' | 'bn';
  onPress: () => void;
}

function DiseaseSummaryCard({ disease, language, onPress }: DiseaseSummaryCardProps) {
  const primaryName = language === 'bn' ? disease.nameBn : disease.nameEn;
  const secondaryName = language === 'bn' ? disease.nameEn : disease.nameBn;
  const overview = language === 'bn' ? disease.shortOverviewBn : disease.shortOverviewEn;
  const categoryName = language === 'bn' ? disease.categoryNameBn : disease.categoryNameEn;
  const subcategory = language === 'bn' ? disease.subcategoryBn : disease.subcategoryEn;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={styles.diseaseCardContainer}
    >
      <Card style={styles.diseaseCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleCol}>
            <View style={styles.cardNameRow}>
              <Text style={styles.diseasePrimaryName}>{primaryName}</Text>
              {disease.isPopular && (
                <View style={styles.popularBadge}>
                  <Sparkles size={11} color={palette.teal700} />
                  <Text style={styles.popularBadgeText}>
                    {language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.diseaseSecondaryName}>{secondaryName}</Text>
          </View>

          <ChevronRight size={20} color={palette.slate400} />
        </View>

        {/* Category & Subcategory Tags */}
        <View style={styles.badgeRow}>
          {categoryName && (
            <Badge
              label={categoryName}
              status="INFO"
              style={styles.categoryBadge}
            />
          )}
          {subcategory && (
            <View style={styles.symptomTag}>
              <Text style={styles.symptomTagText} numberOfLines={1}>
                {subcategory}
              </Text>
            </View>
          )}
        </View>

        {/* Short Overview snippet */}
        {overview && (
          <Text style={styles.overviewSnippet} numberOfLines={2}>
            {overview}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  headerContainer: {
    backgroundColor: palette.white,
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.lg,
    backgroundColor: palette.teal50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: palette.slate900,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.teal50,
    borderWidth: 1,
    borderColor: palette.teal200,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
  },
  modePillActive: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  modePillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.teal700,
  },
  modePillTextActive: {
    color: palette.white,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.teal50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.teal200,
  },
  controlPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.teal800,
  },
  voicePill: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  voicePillActive: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginBottom: 4,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: palette.slate800,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: palette.slate600,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: palette.slate900,
  },
  clearCategoryBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  clearCategoryText: {
    fontSize: typography.sizes.xs,
    color: palette.teal600,
    fontWeight: '600',
  },
  popularScrollContent: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginRight: spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    maxWidth: 180,
  },
  popularChipIcon: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    backgroundColor: palette.teal50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  popularChipName: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.slate900,
  },
  popularChipSub: {
    fontSize: typography.sizes.xs - 2,
    color: palette.slate500,
  },
  categoriesScrollContent: {
    gap: spacing.xs,
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.slate200,
    marginRight: spacing.xs,
  },
  categoryPillSelected: {
    backgroundColor: palette.teal600,
    borderColor: palette.teal600,
  },
  categoryPillIconWrapper: {
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.slate700,
  },
  categoryPillTextSelected: {
    color: palette.white,
  },
  catCountBadge: {
    backgroundColor: palette.slate100,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    marginLeft: 6,
  },
  catCountBadgeSelected: {
    backgroundColor: palette.teal700,
  },
  catCountText: {
    fontSize: 10,
    color: palette.slate600,
    fontWeight: '700',
  },
  catCountTextSelected: {
    color: palette.white,
  },
  diseaseCardContainer: {
    marginBottom: spacing.sm,
  },
  diseaseCard: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitleCol: {
    flex: 1,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  diseasePrimaryName: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: palette.slate900,
  },
  diseaseSecondaryName: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    marginTop: 1,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.teal50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 3,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.teal800,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: spacing.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
  },
  symptomsPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  symptomTag: {
    backgroundColor: palette.slate100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  symptomTagText: {
    fontSize: typography.sizes.xs - 1,
    color: palette.slate600,
  },
  overviewSnippet: {
    fontSize: typography.sizes.xs,
    color: palette.slate600,
    lineHeight: 18,
    marginTop: 4,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: palette.slate700,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: typography.sizes.xs,
    color: palette.slate500,
    textAlign: 'center',
    marginTop: 4,
  },
  disclaimerCard: {
    backgroundColor: palette.teal50,
    borderColor: palette.teal200,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  disclaimerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.teal900,
  },
  disclaimerText: {
    fontSize: typography.sizes.xs,
    color: palette.teal800,
    lineHeight: 18,
  },
});
