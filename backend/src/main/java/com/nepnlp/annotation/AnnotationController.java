package com.nepnlp.annotation;

import com.nepnlp.annotation.AnnotationDtos.AdjudicateRequest;
import com.nepnlp.annotation.AnnotationDtos.Disagreement;
import com.nepnlp.annotation.AnnotationDtos.ExportItem;
import com.nepnlp.annotation.AnnotationDtos.ImportRequest;
import com.nepnlp.annotation.AnnotationDtos.ImportResult;
import com.nepnlp.annotation.AnnotationDtos.LabelRequest;
import com.nepnlp.annotation.AnnotationDtos.LabelView;
import com.nepnlp.annotation.AnnotationDtos.NextItem;
import com.nepnlp.annotation.AnnotationDtos.Progress;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Annotation workflow API. Switch off with {@code NEPNLP_ANNOTATION_ENABLED=false} (the
 * endpoints then do not exist), and set {@code NEPNLP_ANNOTATION_TOKEN} before exposing it
 * anywhere public: every call must then send the same value in {@code X-Annotation-Token}.
 */
@RestController
@RequestMapping("/api/annotation")
@Validated
@ConditionalOnProperty(name = "nepnlp.annotation.enabled", havingValue = "true", matchIfMissing = true)
@Tag(name = "Annotation", description = "Double annotation, adjudication and export for the NepNLP dataset")
public class AnnotationController {

    private final AnnotationService service;
    private final String token;

    public AnnotationController(AnnotationService service,
                                @Value("${nepnlp.annotation.token:}") String token) {
        this.service = service;
        this.token = token;
    }

    private void authorize(String supplied) {
        if (token.isEmpty()) {
            return;
        }
        byte[] a = token.getBytes(StandardCharsets.UTF_8);
        byte[] b = (supplied == null ? "" : supplied).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(a, b)) {
            throw new ForbiddenException();
        }
    }

    @Operation(summary = "Import items to annotate (texts already anonymized + script-tagged)")
    @PostMapping("/items")
    public ImportResult importItems(@RequestHeader(value = "X-Annotation-Token", required = false) String t,
                                    @Valid @RequestBody ImportRequest req) {
        authorize(t);
        return service.importItems(req.items(), req.seed());
    }

    @Operation(summary = "Next item for this annotator (others' labels are never shown)")
    @GetMapping("/next")
    public NextItem next(@RequestHeader(value = "X-Annotation-Token", required = false) String t,
                         @RequestParam @Pattern(regexp = AnnotationDtos.ANNOTATOR_ID) String annotator) {
        authorize(t);
        return service.next(annotator);
    }

    @Operation(summary = "Save (or change) this annotator's label for an item")
    @PostMapping("/labels")
    public LabelView label(@RequestHeader(value = "X-Annotation-Token", required = false) String t,
                           @Valid @RequestBody LabelRequest req) {
        authorize(t);
        return service.label(req);
    }

    @Operation(summary = "Items the annotators disagree on (for adjudication)")
    @GetMapping("/disagreements")
    public List<Disagreement> disagreements(@RequestHeader(value = "X-Annotation-Token", required = false) String t) {
        authorize(t);
        return service.disagreements();
    }

    @Operation(summary = "Record the final label for a disagreement")
    @PostMapping("/adjudications")
    public Adjudication adjudicate(@RequestHeader(value = "X-Annotation-Token", required = false) String t,
                                   @Valid @RequestBody AdjudicateRequest req) {
        authorize(t);
        return service.adjudicate(req);
    }

    @Operation(summary = "Counts per annotator, overlap, disagreements, label set")
    @GetMapping("/progress")
    public Progress progress(@RequestHeader(value = "X-Annotation-Token", required = false) String t) {
        authorize(t);
        return service.progress();
    }

    @Operation(summary = "Everything, for scripts/iaa.py and scripts/export_dataset.py")
    @GetMapping("/export")
    public List<ExportItem> export(@RequestHeader(value = "X-Annotation-Token", required = false) String t) {
        authorize(t);
        return service.export();
    }

    static class ForbiddenException extends RuntimeException {}

    private static Map<String, Object> body(HttpStatus s, String msg) {
        return Map.of("timestamp", Instant.now().toString(), "status", s.value(),
                "error", s.getReasonPhrase(), "message", msg);
    }

    @ExceptionHandler(ForbiddenException.class)
    ResponseEntity<Map<String, Object>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(body(HttpStatus.FORBIDDEN, "missing or wrong X-Annotation-Token"));
    }

    @ExceptionHandler(AnnotationService.BadLabelException.class)
    ResponseEntity<Map<String, Object>> badLabel(AnnotationService.BadLabelException e) {
        return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, e.getMessage()));
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    ResponseEntity<Map<String, Object>> badParam(jakarta.validation.ConstraintViolationException e) {
        return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, "annotator must be a pseudonymous ID like A1"));
    }
}
