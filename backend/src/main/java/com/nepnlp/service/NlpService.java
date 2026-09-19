package com.nepnlp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nepnlp.client.MlServiceClient;
import com.nepnlp.dto.ClassificationResponse;
import com.nepnlp.dto.FeedbackRequest;
import com.nepnlp.dto.SpellCheckResponse;
import com.nepnlp.dto.TranslationRequest;
import com.nepnlp.dto.TranslationResponse;
import com.nepnlp.model.AnalysisRecord;
import com.nepnlp.repository.AnalysisRecordRepository;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class NlpService {

    private static final Logger log = LoggerFactory.getLogger(NlpService.class);

    private final MlServiceClient ml;
    private final AnalysisRecordRepository repo;
    private final ObjectMapper mapper;

    public NlpService(MlServiceClient ml, AnalysisRecordRepository repo, ObjectMapper mapper) {
        this.ml = ml;
        this.repo = repo;
        this.mapper = mapper;
    }

    public ClassificationResponse news(String text) {
        ClassificationResponse res = ml.classifyNews(text);
        save("news", text, res, res.model());
        return res;
    }

    public ClassificationResponse sentiment(String text) {
        ClassificationResponse res = ml.analyzeSentiment(text);
        save("sentiment", text, res, res.model());
        return res;
    }

    public SpellCheckResponse spellcheck(String text) {
        SpellCheckResponse res = ml.spellcheck(text);
        save("spellcheck", text, res, null);
        return res;
    }

    public TranslationResponse translate(TranslationRequest req) {
        TranslationResponse res = ml.translate(req);
        save("translation", req.text(), res, res.model());
        return res;
    }

    public Map<String, Object> mlInfo() {
        return ml.info();
    }

    public List<AnalysisRecord> history(String tool, int limit) {
        var page = PageRequest.of(0, Math.min(Math.max(limit, 1), 200));
        return (tool == null || tool.isBlank())
                ? repo.findAllByOrderByCreatedAtDesc(page)
                : repo.findByToolOrderByCreatedAtDesc(tool, page);
    }

    public AnalysisRecord addFeedback(FeedbackRequest fb) {
        AnalysisRecord rec = repo.findById(fb.recordId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown recordId: " + fb.recordId()));
        rec.setCorrectLabel(fb.correctLabel());
        rec.setModelWasCorrect(fb.modelWasCorrect());
        return repo.save(rec);
    }

    @SuppressWarnings("unchecked")
    private void save(String tool, String input, Object result, String tier) {
        try {
            Map<String, Object> resultMap = mapper.convertValue(result, Map.class);
            repo.save(new AnalysisRecord(tool, input, resultMap, tier));
        } catch (Exception e) {
            log.warn("Could not persist {} analysis: {}", tool, e.getMessage());
        }
    }
}
