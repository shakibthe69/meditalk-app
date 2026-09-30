package com.meditalk.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Read-only cache of general (educational) medicine information fetched from
 * trusted external drug-label sources (DailyMed / openFDA).
 *
 * <p>This table is deliberately separate from {@code medicines}: a user's
 * {@code medicines} row is <em>their prescription</em> and is never modified by
 * online data. This cache only stores normalized general information so the
 * external APIs are not hit on every view. It is shared across users (a drug
 * label is not user-specific) and keyed by a normalized medicine name.</p>
 */
@Entity
@Table(name = "medicine_information_cache",
        indexes = {
                @Index(name = "idx_med_info_lookup_key", columnList = "lookupKey", unique = true)
        })
public class MedicineInformationCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Normalized lookup key (lowercased brand/generic name, no strength). Two
     * OCR spellings of the same drug normalize to the same key, so the cache
     * is reused across users and spellings.
     */
    @Column(name = "lookup_key", nullable = false, length = 150)
    private String lookupKey;

    /** Brand name as returned by the external source (e.g. "Napa"). */
    @Column(name = "brand_name", length = 150)
    private String brandName;

    /** Generic / active ingredient (e.g. "Paracetamol" / "Acetaminophen"). */
    @Column(name = "generic_name", length = 150)
    private String genericName;

    @Column(name = "strength", length = 50)
    private String strength;

    @Column(name = "dosage_form", length = 50)
    private String dosageForm;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "uses", columnDefinition = "TEXT")
    private String uses;

    @Column(name = "dosage_information", columnDefinition = "TEXT")
    private String dosageInformation;

    @Column(name = "side_effects", columnDefinition = "TEXT")
    private String sideEffects;

    @Column(name = "warnings", columnDefinition = "TEXT")
    private String warnings;

    @Column(name = "contraindications", columnDefinition = "TEXT")
    private String contraindications;

    @Column(name = "interactions", columnDefinition = "TEXT")
    private String interactions;

    @Column(name = "storage", columnDefinition = "TEXT")
    private String storage;

    /** "DailyMed", "openFDA", etc. */
    @Column(name = "source", length = 100)
    private String source;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    /** When the external source's label was last revised, when provided. */
    @Column(name = "external_last_updated", length = 50)
    private String externalLastUpdated;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public MedicineInformationCache() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLookupKey() { return lookupKey; }
    public void setLookupKey(String lookupKey) { this.lookupKey = lookupKey; }

    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public String getStrength() { return strength; }
    public void setStrength(String strength) { this.strength = strength; }

    public String getDosageForm() { return dosageForm; }
    public void setDosageForm(String dosageForm) { this.dosageForm = dosageForm; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUses() { return uses; }
    public void setUses(String uses) { this.uses = uses; }

    public String getDosageInformation() { return dosageInformation; }
    public void setDosageInformation(String dosageInformation) { this.dosageInformation = dosageInformation; }

    public String getSideEffects() { return sideEffects; }
    public void setSideEffects(String sideEffects) { this.sideEffects = sideEffects; }

    public String getWarnings() { return warnings; }
    public void setWarnings(String warnings) { this.warnings = warnings; }

    public String getContraindications() { return contraindications; }
    public void setContraindications(String contraindications) { this.contraindications = contraindications; }

    public String getInteractions() { return interactions; }
    public void setInteractions(String interactions) { this.interactions = interactions; }

    public String getStorage() { return storage; }
    public void setStorage(String storage) { this.storage = storage; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getExternalLastUpdated() { return externalLastUpdated; }
    public void setExternalLastUpdated(String externalLastUpdated) { this.externalLastUpdated = externalLastUpdated; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
