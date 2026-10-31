package com.nepnlp.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AnalysisResponse(
        String label,
        double confidence,
        List<LabelScore> scores,
        String model,
        String recordId,
        List<Highlight> highlights
) {}
