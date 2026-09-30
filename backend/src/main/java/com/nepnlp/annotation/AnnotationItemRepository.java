package com.nepnlp.annotation;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface AnnotationItemRepository extends MongoRepository<AnnotationItem, String> {
    boolean existsByText(String text);
}
