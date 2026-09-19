package com.nepnlp.model;

import java.time.Instant;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "analyses")
public class AnalysisRecord {

    @Id
    private String id;

    @Indexed
    private String tool;

    private String input;

    private Map<String, Object> result;

    private String modelTier;

    @Indexed
    private Instant createdAt = Instant.now();

    private String correctLabel;
    private Boolean modelWasCorrect;

    public AnalysisRecord() {}

    public AnalysisRecord(String tool, String input, Map<String, Object> result, String modelTier) {
        this.tool = tool;
        this.input = input;
        this.result = result;
        this.modelTier = modelTier;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTool() { return tool; }
    public void setTool(String tool) { this.tool = tool; }

    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }

    public Map<String, Object> getResult() { return result; }
    public void setResult(Map<String, Object> result) { this.result = result; }

    public String getModelTier() { return modelTier; }
    public void setModelTier(String modelTier) { this.modelTier = modelTier; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getCorrectLabel() { return correctLabel; }
    public void setCorrectLabel(String correctLabel) { this.correctLabel = correctLabel; }

    public Boolean getModelWasCorrect() { return modelWasCorrect; }
    public void setModelWasCorrect(Boolean modelWasCorrect) { this.modelWasCorrect = modelWasCorrect; }
}
