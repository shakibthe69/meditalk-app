package com.meditalk.exceptions;

/**
 * Thrown when the patient tries to save a prescription that matches one already in
 * their record. Prevents duplicate medicines, schedules and reminders.
 */
public class DuplicatePrescriptionException extends RuntimeException {

    public DuplicatePrescriptionException(String message) {
        super(message);
    }
}
