package com.nepnlp.config;

import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MongoDB is used for best-effort persistence (analysis log, feedback, annotations), so an
 * unreachable database must not hang requests: fail fast instead of the driver's 30 s
 * default. Together with {@link MongoIndexInitializer} (indexes created after startup,
 * failures tolerated) the API starts and serves predictions even when Mongo is down.
 */
@Configuration
public class MongoConfig {

    @Bean
    public MongoClientSettingsBuilderCustomizer failFastMongo(
            @Value("${nepnlp.mongo.timeout-ms:3000}") long timeoutMs) {
        return builder -> builder
                .applyToClusterSettings(c -> c.serverSelectionTimeout(timeoutMs, TimeUnit.MILLISECONDS))
                .applyToSocketSettings(s -> s.connectTimeout((int) timeoutMs, TimeUnit.MILLISECONDS));
    }
}
