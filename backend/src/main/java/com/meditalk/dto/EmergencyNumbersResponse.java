package com.meditalk.dto;

import java.util.List;

public class EmergencyNumbersResponse {
    private List<String> numbers;
    private String primaryNumber;

    public EmergencyNumbersResponse() {}

    public List<String> getNumbers() { return numbers; }
    public void setNumbers(List<String> numbers) { this.numbers = numbers; }

    public String getPrimaryNumber() { return primaryNumber; }
    public void setPrimaryNumber(String primaryNumber) { this.primaryNumber = primaryNumber; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final EmergencyNumbersResponse res = new EmergencyNumbersResponse();

        public Builder numbers(List<String> numbers) { res.setNumbers(numbers); return this; }
        public Builder primaryNumber(String primaryNumber) { res.setPrimaryNumber(primaryNumber); return this; }

        public EmergencyNumbersResponse build() { return res; }
    }
}
