package com.nepnlp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SpellCheckResponse(
        List<TokenCheck> tokens,
        @JsonProperty("num_errors") int numErrors
) {}
