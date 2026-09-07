package com.meditalk.dto;

public class AdherenceStatsDto {
    private int takenPercentage;
    private int missedPercentage;
    private int skippedPercentage;
    private int totalScheduled;
    private int totalTaken;
    private int totalMissed;
    private int totalSkipped;

    public AdherenceStatsDto() {}

    public int getTakenPercentage() { return takenPercentage; }
    public void setTakenPercentage(int takenPercentage) { this.takenPercentage = takenPercentage; }

    public int getMissedPercentage() { return missedPercentage; }
    public void setMissedPercentage(int missedPercentage) { this.missedPercentage = missedPercentage; }

    public int getSkippedPercentage() { return skippedPercentage; }
    public void setSkippedPercentage(int skippedPercentage) { this.skippedPercentage = skippedPercentage; }

    public int getTotalScheduled() { return totalScheduled; }
    public void setTotalScheduled(int totalScheduled) { this.totalScheduled = totalScheduled; }

    public int getTotalTaken() { return totalTaken; }
    public void setTotalTaken(int totalTaken) { this.totalTaken = totalTaken; }

    public int getTotalMissed() { return totalMissed; }
    public void setTotalMissed(int totalMissed) { this.totalMissed = totalMissed; }

    public int getTotalSkipped() { return totalSkipped; }
    public void setTotalSkipped(int totalSkipped) { this.totalSkipped = totalSkipped; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final AdherenceStatsDto dto = new AdherenceStatsDto();

        public Builder takenPercentage(int v) { dto.setTakenPercentage(v); return this; }
        public Builder missedPercentage(int v) { dto.setMissedPercentage(v); return this; }
        public Builder skippedPercentage(int v) { dto.setSkippedPercentage(v); return this; }
        public Builder totalScheduled(int v) { dto.setTotalScheduled(v); return this; }
        public Builder totalTaken(int v) { dto.setTotalTaken(v); return this; }
        public Builder totalMissed(int v) { dto.setTotalMissed(v); return this; }
        public Builder totalSkipped(int v) { dto.setTotalSkipped(v); return this; }

        public AdherenceStatsDto build() { return dto; }
    }
}
