package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "disease_categories")
public class DiseaseCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nameEn;

    @Column(nullable = false, length = 150)
    private String nameBn;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(length = 60)
    private String icon = "activity";

    @Column(length = 500)
    private String descriptionEn;

    @Column(length = 500)
    private String descriptionBn;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Disease> diseases = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public DiseaseCategory() {}

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

    public List<Disease> getDiseases() { return diseases; }
    public void setDiseases(List<Disease> diseases) { this.diseases = diseases; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DiseaseCategory c = new DiseaseCategory();

        public Builder id(Long id) { c.setId(id); return this; }
        public Builder nameEn(String nameEn) { c.setNameEn(nameEn); return this; }
        public Builder nameBn(String nameBn) { c.setNameBn(nameBn); return this; }
        public Builder slug(String slug) { c.setSlug(slug); return this; }
        public Builder icon(String icon) { c.setIcon(icon); return this; }
        public Builder descriptionEn(String desc) { c.setDescriptionEn(desc); return this; }
        public Builder descriptionBn(String desc) { c.setDescriptionBn(desc); return this; }
        public Builder displayOrder(Integer order) { c.setDisplayOrder(order); return this; }

        public DiseaseCategory build() { return c; }
    }
}
