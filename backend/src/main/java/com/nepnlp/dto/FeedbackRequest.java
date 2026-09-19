package com.nepnlp.dto;

import jakarta.validation.constraints.NotBlank;

public record FeedbackRequest(
        @NotBlank String recordId,
        String correctLabel,
        Boolean modelWasCorrect
) {}
