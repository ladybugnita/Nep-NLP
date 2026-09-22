package com.nepnlp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Romanized Nepali -> Devanagari result. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TransliterationResponse(String input, String output) {}
