package com.nepnlp.config;

import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
