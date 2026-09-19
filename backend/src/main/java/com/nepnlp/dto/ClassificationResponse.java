package com.nepnlp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClassificationResponse(
        String label,
        double confidence,
        List<LabelScore> scores,
        String model  
) {}
