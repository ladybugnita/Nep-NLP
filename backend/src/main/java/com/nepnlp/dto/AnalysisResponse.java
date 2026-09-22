package com.nepnlp.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * API response for the news + sentiment classifiers. Adds two things over the raw ML result:
 *  - {@code recordId}: the MongoDB id of the stored analysis, so the UI can attach feedback.
 *  - {@code highlights}: polarity words (sentiment only; null for news).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AnalysisResponse(
        String label,
        double confidence,
        List<LabelScore> scores,
        String model,
        String recordId,
        List<Highlight> highlights
) {}
