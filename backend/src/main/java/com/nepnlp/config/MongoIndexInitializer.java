package com.nepnlp.config;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mapping.context.MappingContext;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoPersistentEntity;
import org.springframework.data.mongodb.core.mapping.MongoPersistentProperty;
import org.springframework.stereotype.Component;

/**
 * Creates the {@code @Indexed} indexes once the app is up. Replaces Spring Data's
 * {@code auto-index-creation}, which runs during context startup and makes the whole API
 * fail to start when MongoDB is unreachable. Here a failure is only logged.
 */
@Component
public class MongoIndexInitializer {

    private static final Logger log = LoggerFactory.getLogger(MongoIndexInitializer.class);

    private final MongoTemplate mongo;

    public MongoIndexInitializer(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        ensureIndexes();
    }

    /** @return true if every index was ensured, false if MongoDB was unavailable. */
    public boolean ensureIndexes() {
        MappingContext<? extends MongoPersistentEntity<?>, MongoPersistentProperty> ctx =
                mongo.getConverter().getMappingContext();
        var resolver = new MongoPersistentEntityIndexResolver(ctx);
        try {
            List<? extends MongoPersistentEntity<?>> entities = ctx.getPersistentEntities().stream()
                    .filter(e -> e.isAnnotationPresent(Document.class))
                    .toList();
            for (MongoPersistentEntity<?> entity : entities) {
                IndexOperations ops = mongo.indexOps(entity.getType());
                resolver.resolveIndexFor(entity.getTypeInformation()).forEach(ops::ensureIndex);
            }
            log.info("MongoDB indexes ensured for {} collection(s)", entities.size());
            return true;
        } catch (RuntimeException e) {
            log.warn("MongoDB unavailable, indexes not created ({}). The API keeps running; "
                    + "persistence is best-effort.", e.getMessage());
            return false;
        }
    }
}
