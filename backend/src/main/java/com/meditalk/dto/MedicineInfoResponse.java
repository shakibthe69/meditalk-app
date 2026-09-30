package com.meditalk.dto;

/**
 * General (educational) medicine information from trusted external sources
 * (DailyMed / openFDA), served through the MediTalk backend.
 *
 * <p>Deliberately separate from {@link MedicineResponse}: a user's prescription
 * data is owned by MediTalk and is never merged with or overwritten by online
 * information.</p>
 */
public class MedicineInfoResponse {

    private String queriedName;
    private String brandName;
    private String genericName;
    private String strength;
    private String dosageForm;
    private String description;
    private String uses;
    private String dosageInformation;
    private String sideEffects;
    private String warnings;
    private String contraindications;
    private String interactions;
    private String storage;
    private String source;
    private String sourceUrl;
    private String lastUpdated;
    /** Always null in this version — no reliable Bangladesh price source yet. */
    private String price;
    private String priceNote;
    private String disclaimer;
    private boolean found;
    private boolean cached;

    public MedicineInfoResponse() {}

    public String getQueriedName() { return queriedName; }
    public void setQueriedName(String queriedName) { this.queriedName = queriedName; }

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

    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }

    public String getPrice() { return price; }
    public void setPrice(String price) { this.price = price; }

    public String getPriceNote() { return priceNote; }
    public void setPriceNote(String priceNote) { this.priceNote = priceNote; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public boolean isFound() { return found; }
    public void setFound(boolean found) { this.found = found; }

    public boolean isCached() { return cached; }
    public void setCached(boolean cached) { this.cached = cached; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final MedicineInfoResponse r = new MedicineInfoResponse();

        public Builder queriedName(String v) { r.queriedName = v; return this; }
        public Builder brandName(String v) { r.brandName = v; return this; }
        public Builder genericName(String v) { r.genericName = v; return this; }
        public Builder strength(String v) { r.strength = v; return this; }
        public Builder dosageForm(String v) { r.dosageForm = v; return this; }
        public Builder description(String v) { r.description = v; return this; }
        public Builder uses(String v) { r.uses = v; return this; }
        public Builder dosageInformation(String v) { r.dosageInformation = v; return this; }
        public Builder sideEffects(String v) { r.sideEffects = v; return this; }
        public Builder warnings(String v) { r.warnings = v; return this; }
        public Builder contraindications(String v) { r.contraindications = v; return this; }
        public Builder interactions(String v) { r.interactions = v; return this; }
        public Builder storage(String v) { r.storage = v; return this; }
        public Builder source(String v) { r.source = v; return this; }
        public Builder sourceUrl(String v) { r.sourceUrl = v; return this; }
        public Builder lastUpdated(String v) { r.lastUpdated = v; return this; }
        public Builder price(String v) { r.price = v; return this; }
        public Builder priceNote(String v) { r.priceNote = v; return this; }
        public Builder disclaimer(String v) { r.disclaimer = v; return this; }
        public Builder found(boolean v) { r.found = v; return this; }
        public Builder cached(boolean v) { r.cached = v; return this; }

        public MedicineInfoResponse build() { return r; }
    }
}
