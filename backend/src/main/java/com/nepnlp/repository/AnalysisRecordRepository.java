package com.nepnlp.repository;

import com.nepnlp.model.AnalysisRecord;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AnalysisRecordRepository extends MongoRepository<AnalysisRecord, String> {

    List<AnalysisRecord> findByToolOrderByCreatedAtDesc(String tool, Pageable pageable);

    List<AnalysisRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
