package com.meditalk.dto;

public class DiseaseSummaryDto {
    private Long id;
    private String nameEn;
    private String nameBn;
    private String slug;
    private Long categoryId;
    private String categoryNameEn;
    private String categoryNameBn;
    private String categoryIcon;
    private String subcategoryEn;
    private String subcategoryBn;
    private String shortOverviewEn;
    private String shortOverviewBn;
    private Boolean isPopular;
    private Integer viewCount;
    private String status;

    public DiseaseSummaryDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getNameBn() { return nameBn; }
    public void setNameBn(String nameBn) { this.nameBn = nameBn; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getCategoryNameEn() { return categoryNameEn; }
    public void setCategoryNameEn(String categoryNameEn) { this.categoryNameEn = categoryNameEn; }

    public String getCategoryNameBn() { return categoryNameBn; }
    public void setCategoryNameBn(String categoryNameBn) { this.categoryNameBn = categoryNameBn; }

    public String getCategoryIcon() { return categoryIcon; }
    public void setCategoryIcon(String categoryIcon) { this.categoryIcon = categoryIcon; }

    public String getSubcategoryEn() { return subcategoryEn; }
    public void setSubcategoryEn(String subcategoryEn) { this.subcategoryEn = subcategoryEn; }

    public String getSubcategoryBn() { return subcategoryBn; }
    public void setSubcategoryBn(String subcategoryBn) { this.subcategoryBn = subcategoryBn; }

    public String getShortOverviewEn() { return shortOverviewEn; }
    public void setShortOverviewEn(String shortOverviewEn) { this.shortOverviewEn = shortOverviewEn; }

    public String getShortOverviewBn() { return shortOverviewBn; }
    public void setShortOverviewBn(String shortOverviewBn) { this.shortOverviewBn = shortOverviewBn; }

    public Boolean getIsPopular() { return isPopular; }
    public void setIsPopular(Boolean popular) { isPopular = popular; }

    public Integer getViewCount() { return viewCount; }
    public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DiseaseSummaryDto dto = new DiseaseSummaryDto();

        public Builder id(Long id) { dto.setId(id); return this; }
        public Builder nameEn(String nameEn) { dto.setNameEn(nameEn); return this; }
        public Builder nameBn(String nameBn) { dto.setNameBn(nameBn); return this; }
        public Builder slug(String slug) { dto.setSlug(slug); return this; }
        public Builder categoryId(Long categoryId) { dto.setCategoryId(categoryId); return this; }
        public Builder categoryNameEn(String name) { dto.setCategoryNameEn(name); return this; }
        public Builder categoryNameBn(String name) { dto.setCategoryNameBn(name); return this; }
        public Builder categoryIcon(String icon) { dto.setCategoryIcon(icon); return this; }
        public Builder subcategoryEn(String sub) { dto.setSubcategoryEn(sub); return this; }
        public Builder subcategoryBn(String sub) { dto.setSubcategoryBn(sub); return this; }
        public Builder shortOverviewEn(String ov) { dto.setShortOverviewEn(ov); return this; }
        public Builder shortOverviewBn(String ov) { dto.setShortOverviewBn(ov); return this; }
        public Builder isPopular(Boolean popular) { dto.setIsPopular(popular); return this; }
        public Builder viewCount(Integer count) { dto.setViewCount(count); return this; }
        public Builder status(String status) { dto.setStatus(status); return this; }

        public DiseaseSummaryDto build() { return dto; }
    }
}
