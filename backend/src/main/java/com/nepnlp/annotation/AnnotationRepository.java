package com.nepnlp.annotation;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AnnotationRepository extends MongoRepository<Annotation, String> {
    Optional<Annotation> findByItemIdAndAnnotatorId(String itemId, String annotatorId);
    List<Annotation> findByAnnotatorId(String annotatorId);
    List<Annotation> findByItemIdIn(Collection<String> itemIds);
}
