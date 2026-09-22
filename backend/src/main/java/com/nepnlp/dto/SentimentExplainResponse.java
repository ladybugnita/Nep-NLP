package com.nepnlp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/** ML service /sentiment/explain response: classification + the polarity words it found. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SentimentExplainResponse(
        String label,
        double confidence,
        List<LabelScore> scores,
        String model,
        List<Highlight> highlights
) {}
