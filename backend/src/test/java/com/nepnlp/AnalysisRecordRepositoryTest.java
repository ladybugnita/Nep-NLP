package com.nepnlp;

import static org.assertj.core.api.Assertions.assertThat;

import com.nepnlp.model.AnalysisRecord;
import com.nepnlp.repository.AnalysisRecordRepository;
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
}
