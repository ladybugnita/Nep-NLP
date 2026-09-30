package com.nepnlp.annotation;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** The final label for an item the annotators disagreed on (id = item id). */
@Document(collection = "adjudications")
public class Adjudication {

    @Id
    private String itemId;
    private String label;
    private String adjudicatorId;
    private String note;
    private Instant decidedAt = Instant.now();

    public Adjudication() {}

    public Adjudication(String itemId, String label, String adjudicatorId, String note) {
        this.itemId = itemId;
        this.label = label;
        this.adjudicatorId = adjudicatorId;
        this.note = note;
    }

    public String getItemId() { return itemId; }
    public String getLabel() { return label; }
    public String getAdjudicatorId() { return adjudicatorId; }
    public String getNote() { return note; }
    public Instant getDecidedAt() { return decidedAt; }
}
