package com.nepnlp.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nepnlp.model.AnalysisRecord;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.mongodb.core.MongoTemplate;

@DataMongoTest
class MongoIndexInitializerTest {

    @Autowired
    MongoTemplate mongo;

    @Test
    void createsTheIndexedFieldsAfterStartup() {
        mongo.dropCollection(AnalysisRecord.class);
        mongo.createCollection(AnalysisRecord.class);

        assertThat(new MongoIndexInitializer(mongo).ensureIndexes()).isTrue();

        assertThat(mongo.indexOps(AnalysisRecord.class).getIndexInfo())
                .extracting(i -> i.getName())
                .contains("tool", "createdAt");
    }

    @Test
    void mongoDownIsLoggedNotThrown() {
        MongoTemplate broken = mock(MongoTemplate.class);
        when(broken.getConverter()).thenReturn(mongo.getConverter());
        when(broken.indexOps(any(Class.class)))
                .thenThrow(new DataAccessResourceFailureException("Timed out selecting server"));

        assertThat(new MongoIndexInitializer(broken).ensureIndexes()).isFalse();
    }
}
