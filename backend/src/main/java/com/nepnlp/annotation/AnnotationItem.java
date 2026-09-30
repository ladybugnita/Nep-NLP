package com.nepnlp.annotation;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/** A text to be labelled. {@code order} is a seeded random rank so every annotator sees the
 *  same shuffled order (not grouped by source), and {@code script} comes from nepnorm. */
@Document(collection = "annotation_items")
public class AnnotationItem {

    @Id
    private String id;
    @Indexed(unique = true)
    private String text;
    private String source;
    private String url;
    private String script;
    private Boolean codeMixed;
    private String batch;
    @Indexed
    private long order;
    private Instant importedAt = Instant.now();

    public AnnotationItem() {}

    public AnnotationItem(String text, String source, String url, String script, Boolean codeMixed,
                          String batch, long order) {
        this.text = text;
        this.source = source;
        this.url = url;
        this.script = script;
        this.codeMixed = codeMixed;
        this.batch = batch;
        this.order = order;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getText() { return text; }
    public String getSource() { return source; }
    public String getUrl() { return url; }
    public String getScript() { return script; }
    public Boolean getCodeMixed() { return codeMixed; }
    public String getBatch() { return batch; }
    public long getOrder() { return order; }
    public Instant getImportedAt() { return importedAt; }
}
