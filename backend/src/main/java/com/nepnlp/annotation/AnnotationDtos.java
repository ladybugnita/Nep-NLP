package com.nepnlp.annotation;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

/** Request/response records for /api/annotation (snake_case JSON, like the rest of the API). */
public final class AnnotationDtos {

    private AnnotationDtos() {}

    /** Pseudonymous IDs only (A1, A2, …) — never real names. */
    static final String ANNOTATOR_ID = "^[A-Za-z0-9_-]{1,32}$";

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ImportItem(
            @NotBlank @Size(max = 5000) String text,
            @Size(max = 200) String source,
            @Size(max = 2000) String url,
            @Pattern(regexp = "devanagari|roman_nepali|english|other") String script,
            Boolean codeMixed,
            @Size(max = 100) String batch) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record ImportRequest(@NotEmpty @Size(max = 5000) List<@Valid ImportItem> items, Long seed) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record ImportResult(int imported, int duplicatesSkipped) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ItemView(String id, String text, String script, Boolean codeMixed, String source) {
        static ItemView of(AnnotationItem i) {
            return new ItemView(i.getId(), i.getText(), i.getScript(), i.getCodeMixed(), i.getSource());
        }
    }

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record NextItem(ItemView item, long done, long total) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record LabelRequest(
            @NotBlank String itemId,
            @NotBlank @Pattern(regexp = ANNOTATOR_ID, message = "use a pseudonymous ID like A1") String annotatorId,
            @NotBlank String label,
            List<@Pattern(regexp = "sarcasm|mixed|needs_context|contains_name|not_nepali") String> flags,
            @Size(max = 1000) String note) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record LabelView(String annotatorId, String label, List<String> flags, String note) {
        static LabelView of(Annotation a) {
            return new LabelView(a.getAnnotatorId(), a.getLabel(), a.getFlags(), a.getNote());
        }
    }

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record Disagreement(ItemView item, List<LabelView> labels) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record AdjudicateRequest(
            @NotBlank String itemId,
            @NotBlank @Pattern(regexp = ANNOTATOR_ID, message = "use a pseudonymous ID like A1") String adjudicatorId,
            @NotBlank String label,
            @Size(max = 1000) String note) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record Progress(long items, Map<String, Long> labelsByAnnotator, long itemsWithTwoOrMoreLabels,
                           long disagreements, long adjudicated, List<String> labels) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ExportItem(String id, String text, String source, String url, String script,
                             Boolean codeMixed, String batch, List<LabelView> annotations,
                             String adjudicatedLabel, String adjudicatorId) {}
}
