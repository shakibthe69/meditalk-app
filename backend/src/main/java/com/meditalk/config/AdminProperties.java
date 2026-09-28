package com.meditalk.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Thresholds for the admin monitoring signal.
 *
 * <p>These are deliberately configuration rather than constants scattered
 * through the code, and they decide <em>administrative follow-up priority</em> —
 * never medical severity. Inactivity and medication records are two separate
 * signals and are combined, not conflated.
 */
@Component
@ConfigurationProperties(prefix = "app.admin")
public class AdminProperties {

    /** Days inactive that move a patient from NORMAL to MONITOR. */
    private int inactiveMonitorDays = 2;

    /** Days inactive that raise a FOLLOW_UP. */
    private int inactiveFollowUpDays = 3;

    /** Days inactive that raise HIGH_PRIORITY. */
    private int inactiveHighPriorityDays = 5;

    /** Unconfirmed (PENDING, past its time) doses that raise a follow-up. */
    private int unconfirmedDosesFollowUp = 3;

    /** Unconfirmed doses that raise HIGH_PRIORITY. */
    private int unconfirmedDosesHighPriority = 6;

    /** Adherence below this percentage is treated as a monitoring signal. */
    private int lowAdherencePercent = 70;

    /** Prescriptions expiring within this many days are surfaced to admins. */
    private int prescriptionExpiryWarningDays = 7;

    /** Doses that must accumulate before a single aggregated admin alert is sent. */
    private int missedDoseAlertAggregation = 3;

    public int getInactiveMonitorDays() { return inactiveMonitorDays; }
    public void setInactiveMonitorDays(int inactiveMonitorDays) { this.inactiveMonitorDays = inactiveMonitorDays; }

    public int getInactiveFollowUpDays() { return inactiveFollowUpDays; }
    public void setInactiveFollowUpDays(int inactiveFollowUpDays) { this.inactiveFollowUpDays = inactiveFollowUpDays; }

    public int getInactiveHighPriorityDays() { return inactiveHighPriorityDays; }
    public void setInactiveHighPriorityDays(int inactiveHighPriorityDays) { this.inactiveHighPriorityDays = inactiveHighPriorityDays; }

    public int getUnconfirmedDosesFollowUp() { return unconfirmedDosesFollowUp; }
    public void setUnconfirmedDosesFollowUp(int unconfirmedDosesFollowUp) { this.unconfirmedDosesFollowUp = unconfirmedDosesFollowUp; }

    public int getUnconfirmedDosesHighPriority() { return unconfirmedDosesHighPriority; }
    public void setUnconfirmedDosesHighPriority(int unconfirmedDosesHighPriority) { this.unconfirmedDosesHighPriority = unconfirmedDosesHighPriority; }

    public int getLowAdherencePercent() { return lowAdherencePercent; }
    public void setLowAdherencePercent(int lowAdherencePercent) { this.lowAdherencePercent = lowAdherencePercent; }

    public int getPrescriptionExpiryWarningDays() { return prescriptionExpiryWarningDays; }
    public void setPrescriptionExpiryWarningDays(int prescriptionExpiryWarningDays) { this.prescriptionExpiryWarningDays = prescriptionExpiryWarningDays; }

    public int getMissedDoseAlertAggregation() { return missedDoseAlertAggregation; }
    public void setMissedDoseAlertAggregation(int missedDoseAlertAggregation) { this.missedDoseAlertAggregation = missedDoseAlertAggregation; }
}
