package com.nepnlp;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nepnlp.dto.FeedbackRequest;
import com.nepnlp.model.AnalysisRecord;
import com.nepnlp.repository.AnalysisRecordRepository;
import com.nepnlp.service.NlpService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.data.domain.PageRequest;

@DataMongoTest
class AnalysisRecordRepositoryTest {

    @Autowired
    AnalysisRecordRepository repo;

    @Test
    void savesAndReadsBackNestedResult() {
        repo.deleteAll();
        Map<String, Object> result = Map.of(
                "label", "खेलकुद",
                "confidence", 0.83,
                "model", "baseline");
        repo.save(new AnalysisRecord("news", "नेपालले खेल जित्यो।", result, "baseline"));

        List<AnalysisRecord> recent =
                repo.findByToolOrderByCreatedAtDesc("news", PageRequest.of(0, 10));

        assertThat(recent).hasSize(1);
        AnalysisRecord r = recent.get(0);
        assertThat(r.getId()).isNotBlank();
        assertThat(r.getInput()).contains("खेल");
        assertThat(r.getResult()).containsEntry("label", "खेलकुद");
        assertThat(r.getModelTier()).isEqualTo("baseline");
        assertThat(r.getCreatedAt()).isNotNull();
    }

    @Test
    void filtersByTool() {
        repo.deleteAll();
        repo.save(new AnalysisRecord("news", "क", Map.of("label", "x"), "baseline"));
        repo.save(new AnalysisRecord("sentiment", "ख", Map.of("label", "y"), "baseline"));

        assertThat(repo.findByToolOrderByCreatedAtDesc("sentiment", PageRequest.of(0, 10)))
                .singleElement()
                .satisfies(r -> assertThat(r.getInput()).isEqualTo("ख"));
    }

    @Test
    void feedbackUpdatesStoredRecord() {
        // The feedback loop: a stored prediction gets a user correction written back to it.
        repo.deleteAll();
        AnalysisRecord saved = repo.save(new AnalysisRecord(
                "news", "नेपालले खेल जित्यो।", Map.of("label", "राजनीति"), "baseline"));

        // ml client is not used by addFeedback, so null is fine here.
        NlpService service = new NlpService(null, repo, new ObjectMapper());
        service.addFeedback(new FeedbackRequest(saved.getId(), "खेलकुद", false));

        AnalysisRecord after = repo.findById(saved.getId()).orElseThrow();
        assertThat(after.getCorrectLabel()).isEqualTo("खेलकुद");
        assertThat(after.getModelWasCorrect()).isFalse();
    }
}
