package com.nepnlp.client;

import com.nepnlp.dto.ClassificationResponse;
import com.nepnlp.dto.SpellCheckResponse;
import com.nepnlp.dto.TextRequest;
import com.nepnlp.dto.TranslationRequest;
import com.nepnlp.dto.TranslationResponse;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MlServiceClient {

    private final RestClient client;

    public MlServiceClient(RestClient mlRestClient) {
        this.client = mlRestClient;
    }

    public ClassificationResponse classifyNews(String text) {
        return client.post().uri("/news/classify")
                .body(new TextRequest(text))
                .retrieve().body(ClassificationResponse.class);
    }

    public ClassificationResponse analyzeSentiment(String text) {
        return client.post().uri("/sentiment")
                .body(new TextRequest(text))
                .retrieve().body(ClassificationResponse.class);
    }

    public SpellCheckResponse spellcheck(String text) {
        return client.post().uri("/spellcheck")
                .body(new TextRequest(text))
                .retrieve().body(SpellCheckResponse.class);
    }

    public TranslationResponse translate(TranslationRequest req) {
        return client.post().uri("/translate")
                .body(req)
                .retrieve().body(TranslationResponse.class);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> info() {
        return client.get().uri("/info").retrieve().body(Map.class);
    }
}
