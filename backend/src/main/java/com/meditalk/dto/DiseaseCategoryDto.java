package com.meditalk.dto;

public class DiseaseCategoryDto {
    private Long id;
    private String nameEn;
    private String nameBn;
    private String slug;
    private String icon;
    private String descriptionEn;
    private String descriptionBn;
    private Integer displayOrder;
    private Long diseaseCount;

    public DiseaseCategoryDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getNameBn() { return nameBn; }
    public void setNameBn(String nameBn) { this.nameBn = nameBn; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getDescriptionEn() { return descriptionEn; }
    public void setDescriptionEn(String descriptionEn) { this.descriptionEn = descriptionEn; }

    public String getDescriptionBn() { return descriptionBn; }
    public void setDescriptionBn(String descriptionBn) { this.descriptionBn = descriptionBn; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public Long getDiseaseCount() { return diseaseCount; }
    public void setDiseaseCount(Long diseaseCount) { this.diseaseCount = diseaseCount; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DiseaseCategoryDto dto = new DiseaseCategoryDto();

        public Builder id(Long id) { dto.setId(id); return this; }
        public Builder nameEn(String nameEn) { dto.setNameEn(nameEn); return this; }
        public Builder nameBn(String nameBn) { dto.setNameBn(nameBn); return this; }
        public Builder slug(String slug) { dto.setSlug(slug); return this; }
        public Builder icon(String icon) { dto.setIcon(icon); return this; }
        public Builder descriptionEn(String desc) { dto.setDescriptionEn(desc); return this; }
        public Builder descriptionBn(String desc) { dto.setDescriptionBn(desc); return this; }
        public Builder displayOrder(Integer order) { dto.setDisplayOrder(order); return this; }
        public Builder diseaseCount(Long count) { dto.setDiseaseCount(count); return this; }

        public DiseaseCategoryDto build() { return dto; }
    }
}
