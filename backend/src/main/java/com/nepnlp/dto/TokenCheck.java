package com.nepnlp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TokenCheck(
        String token,
        @JsonProperty("is_correct") boolean isCorrect,
        List<String> suggestions
) {}
