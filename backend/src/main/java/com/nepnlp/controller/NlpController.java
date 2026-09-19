package com.nepnlp.controller;

import com.nepnlp.dto.ClassificationResponse;
import com.nepnlp.dto.FeedbackRequest;
import com.nepnlp.dto.SpellCheckResponse;
import com.nepnlp.dto.TextRequest;
import com.nepnlp.dto.TranslationRequest;
import com.nepnlp.dto.TranslationResponse;
import com.nepnlp.model.AnalysisRecord;
import com.nepnlp.service.NlpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "NepNLP", description = "Nepali NLP tools: news, sentiment, spell-check, translation")
public class NlpController {

    private final NlpService service;

    public NlpController(NlpService service) {
        this.service = service;
    }

    @Operation(summary = "Classify a Nepali news article/headline by topic")
    @PostMapping("/news")
    public ClassificationResponse news(@Valid @RequestBody TextRequest req) {
        return service.news(req.text());
    }

    @Operation(summary = "Detect sentiment (positive / negative / neutral) of Nepali text")
    @PostMapping("/sentiment")
    public ClassificationResponse sentiment(@Valid @RequestBody TextRequest req) {
        return service.sentiment(req.text());
    }

    @Operation(summary = "Spell-check Nepali text; returns per-token suggestions")
    @PostMapping("/spellcheck")
    public SpellCheckResponse spellcheck(@Valid @RequestBody TextRequest req) {
        return service.spellcheck(req.text());
    }

    @Operation(summary = "Translate between Nepali and English")
    @PostMapping("/translate")
    public TranslationResponse translate(@Valid @RequestBody TranslationRequest req) {
        return service.translate(req);
    }

    @Operation(summary = "Which ML tools are loaded and at which tier")
    @GetMapping("/ml-info")
    public Map<String, Object> mlInfo() {
        return service.mlInfo();
    }

    @Operation(summary = "Recent analyses (optionally filtered by tool)")
    @GetMapping("/history")
    public List<AnalysisRecord> history(
            @RequestParam(required = false) String tool,
            @RequestParam(defaultValue = "20") int limit) {
        return service.history(tool, limit);
    }

    @Operation(summary = "Submit feedback on a stored prediction (builds training data)")
    @PostMapping("/feedback")
    public AnalysisRecord feedback(@Valid @RequestBody FeedbackRequest req) {
        return service.addFeedback(req);
    }
}
