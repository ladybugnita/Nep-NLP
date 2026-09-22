package com.nepnlp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** A polarity-bearing word found in sentiment text (for the "why?" explanation). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Highlight(String word, String polarity) {}
