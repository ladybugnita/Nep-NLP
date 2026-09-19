package com.nepnlp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TranslationResponse(
        String translation,
        String source,
        String target,
        String model,
        boolean available,
        String detail
) {}
