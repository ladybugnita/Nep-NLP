package com.nepnlp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TranslationRequest(
        @NotBlank @Size(max = 5000) String text,
        @Pattern(regexp = "ne|en", message = "source must be 'ne' or 'en'") String source,
        @Pattern(regexp = "ne|en", message = "target must be 'ne' or 'en'") String target
) {
    public TranslationRequest {
        if (source == null) source = "ne";
        if (target == null) target = "en";
    }
}
